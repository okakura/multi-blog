use axum::{
    extract::{ConnectInfo, FromRequestParts, Request},
    http::{StatusCode, request::Parts},
    middleware::Next,
    response::Response,
};
use dashmap::DashMap;
use governor::{
    Quota, RateLimiter,
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
};
use serde::Deserialize;
use std::{
    net::{IpAddr, SocketAddr},
    num::NonZeroU32,
    sync::Arc,
    time::{Duration, Instant},
};
use tracing::{info, warn};

/// Represents the real client IP address, extracted from headers or socket info.
#[derive(Debug, Clone)]
pub struct ClientIp(pub IpAddr);

// Implement a custom extractor to get the client's IP address
impl<S> FromRequestParts<S> for ClientIp
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract IP from `X-Forwarded-For` header (first IP in comma-separated list)
        if let Some(forwarded_for) = parts
            .headers
            .get("X-Forwarded-For")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.split(',').next())
            .and_then(|ip_str| ip_str.trim().parse().ok())
        {
            return Ok(ClientIp(forwarded_for));
        }

        // Extract IP from `X-Real-IP` header
        if let Some(real_ip) = parts
            .headers
            .get("X-Real-IP")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.trim().parse().ok())
        {
            return Ok(ClientIp(real_ip));
        }

        // Fallback to connection info
        if let Some(ConnectInfo(addr)) = parts.extensions.get::<ConnectInfo<SocketAddr>>() {
            return Ok(ClientIp(addr.ip()));
        }

        Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "Could not extract client IP address",
        ))
    }
}

/// Configuration for different rate limiting scenarios.
/// Can be customized via environment variables.
// TODO: Implement dynamic configuration loading
#[derive(Debug, Clone, Deserialize)]
pub struct RateLimitConfig {
    /// Maximum requests per time window
    pub max_requests: NonZeroU32,
    /// Time window in seconds
    pub window_seconds: u64,
}

impl RateLimitConfig {
    /// Authentication endpoints - more restrictive
    /// 5 requests per minute
    pub fn auth() -> Self {
        Self {
            max_requests: NonZeroU32::new(5).unwrap(),
            window_seconds: 60,
        }
    }

    /// Admin endpoints - strict rate limiting
    /// 10 requests per minute
    pub fn admin() -> Self {
        Self {
            max_requests: NonZeroU32::new(10).unwrap(),
            window_seconds: 60,
        }
    }

    /// Read-only endpoints - more permissive
    /// 100 requests per minute
    pub fn read_only() -> Self {
        Self {
            max_requests: NonZeroU32::new(100).unwrap(),
            window_seconds: 60,
        }
    }

    /// Default rate limiting for general API endpoints
    /// 30 requests per minute
    pub fn default() -> Self {
        Self {
            max_requests: NonZeroU32::new(30).unwrap(),
            window_seconds: 60,
        }
    }

    /// Very strict rate limiting for sensitive operations
    /// 3 requests per minute
    pub fn strict() -> Self {
        Self {
            max_requests: NonZeroU32::new(3).unwrap(),
            window_seconds: 60,
        }
    }
}

/// Wrapper for the rate limiter to include last access time.
struct LimiterState {
    limiter: IpRateLimiter,
    last_accessed: Instant,
}

impl LimiterState {
    fn new(limiter: IpRateLimiter) -> Self {
        Self {
            limiter,
            last_accessed: Instant::now(),
        }
    }

    fn touch(&mut self) {
        self.last_accessed = Instant::now();
    }

    fn is_stale(&self, timeout: Duration) -> bool {
        self.last_accessed.elapsed() > timeout
    }
}

/// Type alias for our rate limiter
type IpRateLimiter = Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>;

// TODO: Configurable cleanup
// TODO: IP whitelisting/blacklisting
/// Rate limiting middleware that tracks by IP address
#[derive(Clone)]
pub struct RateLimitMiddleware {
    limiters: Arc<DashMap<IpAddr, LimiterState>>,
    config: RateLimitConfig,
    _cleanup_handle: Arc<tokio::task::JoinHandle<()>>,
}

impl RateLimitMiddleware {
    /// Create a new rate limiting middleware with the given configuration
    pub fn new(config: RateLimitConfig) -> Self {
        let limiters = Arc::new(DashMap::new());

        // Start cleanup task
        let cleanup_handle = Self::start_cleanup_task(limiters.clone(), Duration::from_secs(300));

        Self {
            limiters,
            config,
            _cleanup_handle: Arc::new(cleanup_handle),
        }
    }

    /// Start background task to clean up old rate limiters
    fn start_cleanup_task(
        limiters: Arc<DashMap<IpAddr, LimiterState>>,
        cleanup_interval_secs: Duration,
    ) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(cleanup_interval_secs);
            // Stale time should be longer than the rate limit window
            let stale_after = Duration::from_secs(3600);

            loop {
                interval.tick().await;

                let initial_count = limiters.len();
                limiters.retain(|_, state| !state.is_stale(stale_after));
                let final_count = limiters.len();

                if initial_count > final_count {
                    info!(
                        cleaned = initial_count - final_count,
                        remaining = final_count,
                        "Cleaned up unused rate limiters"
                    );
                }

                if final_count > 10000 {
                    warn!(
                        active_limiters = final_count,
                        "Large number of active rate limiters, consider shorter cleanup interval"
                    );
                }
            }
        })
    }

    /// Get or create a rate limiter for the given IP
    fn get_limiter(&self, ip: IpAddr) -> IpRateLimiter {
        if let Some(mut entry) = self.limiters.get_mut(&ip) {
            entry.touch();
            return entry.limiter.clone();
        }

        let quota = Quota::with_period(Duration::from_secs(self.config.window_seconds))
            .unwrap()
            .allow_burst(self.config.max_requests);
        let limiter = Arc::new(RateLimiter::direct(quota));

        self.limiters.insert(ip, LimiterState::new(limiter.clone()));
        limiter
    }

    /// Apply rate limiting middleware
    pub async fn apply(
        &self,
        ClientIp(ip): ClientIp,
        request: Request,
        next: Next,
    ) -> Result<Response, StatusCode> {
        // Get rate limiter for this IP
        let limiter = self.get_limiter(ip);

        // Check rate limit
        match limiter.check() {
            Ok(_) => {
                // Rate limit passed, continue
                tracing::debug!(
                    ip = %ip,
                    "Rate limit check passed"
                );
                Ok(next.run(request).await)
            }
            Err(_) => {
                // Rate limit exceeded
                warn!(
                    ip = %ip,
                    max_requests = %self.config.max_requests,
                    window_seconds = self.config.window_seconds,
                    "Rate limit exceeded"
                );

                // Record metrics
                crate::telemetry::record_http_metrics("RATE_LIMITED", "/", 429, 0);

                Err(StatusCode::TOO_MANY_REQUESTS)
            }
        }
    }
}

/// Helper function to create a rate limiting middleware
pub fn create_rate_limiter(config: RateLimitConfig) -> RateLimitMiddleware {
    RateLimitMiddleware::new(config)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderMap;
    use std::net::{Ipv4Addr, Ipv6Addr};

    #[tokio::test]
    async fn test_client_ip_extractor() {
        // Test X-Forwarded-For
        let mut headers = HeaderMap::new();
        headers.insert("X-Forwarded-For", "192.168.0.1, 10.0.0.1".parse().unwrap());
        let mut parts = Parts {
            headers,
            ..Default::default()
        };
        let ip = ClientIp::from_request_parts(&mut parts, &()).await.unwrap();
        assert_eq!(ip.0, IpAddr::V4(Ipv4Addr::new(192, 168, 0, 1)));

        // Test X-Real-IP
        let mut headers = HeaderMap::new();
        headers.insert("X-Real-IP", "2001:db8::1".parse().unwrap());
        let mut parts = Parts {
            headers,
            ..Default::default()
        };
        let ip = ClientIp::from_request_parts(&mut parts, &()).await.unwrap();
        assert_eq!(
            ip.0,
            IpAddr::V6(Ipv6Addr::new(0x2001, 0xdb8, 0, 0, 0, 0, 0, 1))
        );

        // Test fallback to ConnectInfo
        let mut parts = Parts {
            ..Default::default()
        };
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), 8080);
        parts.extensions.insert(ConnectInfo(addr));
        let ip = ClientIp::from_request_parts(&mut parts, &()).await.unwrap();
        assert_eq!(ip.0, IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)));
    }

    #[tokio::test]
    async fn test_rate_limit_configs() {
        let auth_config = RateLimitConfig::auth();
        assert_eq!(auth_config.max_requests.get(), 5);
        assert_eq!(auth_config.window_seconds, 60);

        let admin_config = RateLimitConfig::admin();
        assert_eq!(admin_config.max_requests.get(), 10);

        let read_only_config = RateLimitConfig::read_only();
        assert_eq!(read_only_config.max_requests.get(), 100);

        let default_config = RateLimitConfig::default();
        assert_eq!(default_config.max_requests.get(), 30);

        let strict_config = RateLimitConfig::strict();
        assert_eq!(strict_config.max_requests.get(), 3);
    }

    #[tokio::test]
    async fn test_rate_limiter_creation() {
        let config = RateLimitConfig::default();
        let middleware = RateLimitMiddleware::new(config);

        // Test that we can get a limiter
        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));
        let limiter = middleware.get_limiter(ip);

        // Should allow initial requests
        assert!(limiter.check().is_ok());
    }

    #[tokio::test]
    async fn test_rate_limiting_enforcement() {
        // Create a very restrictive config for testing
        let config = RateLimitConfig {
            max_requests: NonZeroU32::new(2).unwrap(),
            window_seconds: 1,
        };

        let middleware = RateLimitMiddleware::new(config);
        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));
        let limiter = middleware.get_limiter(ip);

        // First two requests should pass
        assert!(limiter.check().is_ok());
        assert!(limiter.check().is_ok());

        // Third request should be rate limited
        assert!(limiter.check().is_err());
    }

    #[tokio::test]
    async fn test_cleanup_task() {
        let limiters = Arc::new(DashMap::new());
        let ip1 = IpAddr::V4(Ipv4Addr::new(1, 1, 1, 1));
        let ip2 = IpAddr::V4(Ipv4Addr::new(2, 2, 2, 2));

        let quota = Quota::with_period(Duration::from_secs(60))
            .unwrap()
            .allow_burst(NonZeroU32::new(10).unwrap());
        let limiter1 = Arc::new(RateLimiter::direct(quota.clone()));
        let limiter2 = Arc::new(RateLimiter::direct(quota));

        limiters.insert(ip1, LimiterState::new(limiter1));
        limiters.insert(ip2, LimiterState::new(limiter2));

        // Manually create a stale entry
        let mut stale_entry = limiters.get_mut(&ip1).unwrap();
        stale_entry.last_accessed = Instant::now() - Duration::from_secs(4000);

        assert_eq!(limiters.len(), 2);

        // Run cleanup logic
        let stale_after = Duration::from_secs(3600);
        limiters.retain(|_, state| !state.is_stale(stale_after));

        assert_eq!(limiters.len(), 1);
        assert!(limiters.contains_key(&ip2));
    }
}
