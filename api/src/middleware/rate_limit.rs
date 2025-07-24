use axum::{
    extract::{ConnectInfo, Request},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use governor::{
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
use std::{
    collections::HashMap,
    net::{IpAddr, SocketAddr},
    num::NonZeroU32,
    sync::Arc,
    time::Duration,
};
use tokio::sync::RwLock;
use tracing::{info, warn};

/// Configuration for different rate limiting scenarios
#[derive(Debug, Clone)]
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

/// Type alias for our rate limiter
type IpRateLimiter = Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>;

/// Rate limiting middleware that tracks by IP address
#[derive(Clone)]
pub struct RateLimitMiddleware {
    limiters: Arc<RwLock<HashMap<IpAddr, IpRateLimiter>>>,
    config: RateLimitConfig,
    cleanup_handle: Arc<tokio::task::JoinHandle<()>>,
}

impl RateLimitMiddleware {
    /// Create a new rate limiting middleware with the given configuration
    pub fn new(config: RateLimitConfig) -> Self {
        let limiters = Arc::new(RwLock::new(HashMap::new()));
        
        // Start cleanup task
        let cleanup_handle = Self::start_cleanup_task(limiters.clone());
        
        Self {
            limiters,
            config,
            cleanup_handle: Arc::new(cleanup_handle),
        }
    }

    /// Start background task to clean up old rate limiters
    fn start_cleanup_task(limiters: Arc<RwLock<HashMap<IpAddr, IpRateLimiter>>>) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(300)); // Every 5 minutes
            
            loop {
                interval.tick().await;
                
                let mut limiters_map = limiters.write().await;
                let initial_count = limiters_map.len();
                
                // Remove limiters that haven't been used recently
                limiters_map.retain(|_ip, limiter| {
                    // Keep limiters that still have remaining capacity or recent activity
                    limiter.check().is_err() || limiter.check().is_ok()
                });
                
                let final_count = limiters_map.len();
                if initial_count > final_count {
                    info!(
                        cleaned = initial_count - final_count,
                        remaining = final_count,
                        "Cleaned up unused rate limiters"
                    );
                }
                
                // Warn if we have too many active limiters
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
    async fn get_limiter(&self, ip: IpAddr) -> IpRateLimiter {
        // Try to get existing limiter first (read lock)
        {
            let limiters = self.limiters.read().await;
            if let Some(limiter) = limiters.get(&ip) {
                return limiter.clone();
            }
        }

        // Need to create new limiter (write lock)
        let mut limiters = self.limiters.write().await;
        
        // Double-check in case another task created it while we were waiting
        if let Some(limiter) = limiters.get(&ip) {
            return limiter.clone();
        }

        // Create new rate limiter for this IP
        let quota = Quota::with_period(Duration::from_secs(self.config.window_seconds))
            .unwrap()
            .allow_burst(self.config.max_requests);
        
        let limiter = Arc::new(RateLimiter::direct(quota));
        limiters.insert(ip, limiter.clone());
        
        limiter
    }

    /// Apply rate limiting middleware
    pub async fn apply(
        &self,
        ConnectInfo(addr): ConnectInfo<SocketAddr>,
        request: Request,
        next: Next,
    ) -> Result<Response, StatusCode> {
        let ip = addr.ip();
        
        // Get rate limiter for this IP
        let limiter = self.get_limiter(ip).await;
        
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
    use std::net::{IpAddr, Ipv4Addr};

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
        let limiter = middleware.get_limiter(ip).await;
        
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
        let limiter = middleware.get_limiter(ip).await;
        
        // First two requests should pass
        assert!(limiter.check().is_ok());
        assert!(limiter.check().is_ok());
        
        // Third request should be rate limited
        assert!(limiter.check().is_err());
    }
}
