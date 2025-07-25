// src/services/session_tracking.rs
use axum::http::HeaderMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, types::ipnetwork::IpNetwork};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserSession {
    pub id: Uuid,
    pub session_id: Uuid,
    pub ip_address: Option<IpAddr>,
    pub user_agent: Option<String>,
    pub domain_name: Option<String>,
    pub started_at: DateTime<Utc>,
    pub last_activity_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub page_views: i32,
    pub is_bot: bool,
    pub referrer: Option<String>,
    pub utm_source: Option<String>,
    pub utm_medium: Option<String>,
    pub utm_campaign: Option<String>,
    pub device_type: DeviceType,
    pub browser: Option<String>,
    pub os: Option<String>,
    pub country: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text")]
pub enum DeviceType {
    #[sqlx(rename = "mobile")]
    Mobile,
    #[sqlx(rename = "desktop")]
    Desktop,
    #[sqlx(rename = "tablet")]
    Tablet,
    #[sqlx(rename = "unknown")]
    Unknown,
}

impl DeviceType {
    pub fn from_user_agent(user_agent: &str) -> Self {
        let ua_lower = user_agent.to_lowercase();

        if ua_lower.contains("mobile")
            || ua_lower.contains("android")
            || ua_lower.contains("iphone")
            || ua_lower.contains("blackberry")
            || ua_lower.contains("webos")
        {
            DeviceType::Mobile
        } else if ua_lower.contains("ipad")
            || ua_lower.contains("tablet")
            || ua_lower.contains("kindle")
        {
            DeviceType::Tablet
        } else if ua_lower.contains("mozilla")
            || ua_lower.contains("chrome")
            || ua_lower.contains("safari")
            || ua_lower.contains("firefox")
            || ua_lower.contains("edge")
        {
            DeviceType::Desktop
        } else {
            DeviceType::Unknown
        }
    }
}

#[derive(Debug)]
pub struct SessionInfo {
    pub user_agent: Option<String>,
    pub ip_address: Option<IpAddr>,
    pub referrer: Option<String>,
    pub domain_name: Option<String>,
}

impl SessionInfo {
    pub fn from_headers(headers: &HeaderMap, domain: Option<String>) -> Self {
        Self {
            user_agent: headers
                .get("user-agent")
                .and_then(|h| h.to_str().ok())
                .map(String::from),
            ip_address: headers
                .get("x-forwarded-for")
                .or_else(|| headers.get("x-real-ip"))
                .and_then(|h| h.to_str().ok())
                .and_then(|ip| ip.parse().ok()),
            referrer: headers
                .get("referer")
                .and_then(|h| h.to_str().ok())
                .map(String::from),
            domain_name: domain,
        }
    }
}

pub struct SessionTracker;

impl SessionTracker {
    /// Create or retrieve existing session
    pub async fn get_or_create_session(
        db: &PgPool,
        session_id: Uuid,
        session_info: SessionInfo,
    ) -> Result<Uuid, sqlx::Error> {
        // First try to find existing session
        if let Ok(existing) = sqlx::query!(
            "SELECT id FROM user_sessions WHERE session_id = $1 AND ended_at IS NULL",
            session_id
        )
        .fetch_one(db)
        .await
        {
            // Update last activity
            sqlx::query!(
                "UPDATE user_sessions SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1",
                existing.id
            )
            .execute(db)
            .await?;

            return Ok(existing.id);
        }

        // Create new session
        let device_type = session_info
            .user_agent
            .as_ref()
            .map(|ua| DeviceType::from_user_agent(ua))
            .unwrap_or(DeviceType::Unknown);

        let browser = Self::extract_browser(&session_info.user_agent);
        let os = Self::extract_os(&session_info.user_agent);
        let is_bot = Self::is_bot(&session_info.user_agent);

        let session = sqlx::query!(
            r#"
            INSERT INTO user_sessions (
                session_id, ip_address, user_agent, domain_name, 
                device_type, browser, os, is_bot, referrer
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
            "#,
            session_id,
            session_info.ip_address.map(|ip| IpNetwork::from(ip)),
            session_info.user_agent,
            session_info.domain_name,
            device_type as DeviceType,
            browser,
            os,
            is_bot,
            session_info.referrer
        )
        .fetch_one(db)
        .await?;

        Ok(session.id)
    }

    /// End a session (called when user leaves or session expires)
    pub async fn end_session(db: &PgPool, session_id: Uuid) -> Result<(), sqlx::Error> {
        // Call the database function to end the session
        sqlx::query!("SELECT end_session($1)", session_id)
            .execute(db)
            .await?;

        Ok(())
    }

    // Helper functions for parsing user agent
    fn extract_browser(user_agent: &Option<String>) -> Option<String> {
        let ua = user_agent.as_ref()?;
        let ua_lower = ua.to_lowercase();

        if ua_lower.contains("edg/") || ua_lower.contains("edge/") {
            Some("Edge".to_string())
        } else if ua_lower.contains("chrome/") {
            Some("Chrome".to_string())
        } else if ua_lower.contains("firefox/") {
            Some("Firefox".to_string())
        } else if ua_lower.contains("safari/") && !ua_lower.contains("chrome") {
            Some("Safari".to_string())
        } else if ua_lower.contains("opera/") || ua_lower.contains("opr/") {
            Some("Opera".to_string())
        } else {
            Some("Unknown".to_string())
        }
    }

    fn extract_os(user_agent: &Option<String>) -> Option<String> {
        let ua = user_agent.as_ref()?;
        let ua_lower = ua.to_lowercase();

        if ua_lower.contains("mac os x") || ua_lower.contains("macos") {
            Some("macOS".to_string())
        } else if ua_lower.contains("windows nt") {
            Some("Windows".to_string())
        } else if ua_lower.contains("iphone") {
            Some("iOS".to_string())
        } else if ua_lower.contains("ipad") {
            Some("iPadOS".to_string())
        } else if ua_lower.contains("android") {
            Some("Android".to_string())
        } else if ua_lower.contains("linux") {
            Some("Linux".to_string())
        } else {
            Some("Unknown".to_string())
        }
    }

    fn is_bot(user_agent: &Option<String>) -> bool {
        let ua = user_agent.as_ref().map(|s| s.to_lowercase());

        if let Some(ua_lower) = ua {
            ua_lower.contains("bot")
                || ua_lower.contains("crawler")
                || ua_lower.contains("spider")
                || ua_lower.contains("scraper")
                || ua_lower.contains("facebookexternalhit")
                || ua_lower.contains("twitterbot")
                || ua_lower.contains("linkedinbot")
                || ua_lower.contains("googlebot")
        } else {
            false
        }
    }

    /// Get device breakdown for analytics
    pub async fn get_device_breakdown(
        db: &PgPool,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        domain_name: Option<&str>,
    ) -> Result<(i64, i64, i64, i64), sqlx::Error> {
        let (mobile, desktop, tablet, unknown) = if let Some(domain) = domain_name {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile,
                    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop,
                    COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet,
                    COUNT(*) FILTER (WHERE device_type = 'unknown') as unknown
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2 
                AND domain_name = $3
                AND is_bot = false
                "#,
                start_date,
                end_date,
                domain
            )
            .fetch_one(db)
            .await?;
            (
                result.mobile.unwrap_or(0),
                result.desktop.unwrap_or(0),
                result.tablet.unwrap_or(0),
                result.unknown.unwrap_or(0),
            )
        } else {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile,
                    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop,
                    COUNT(*) FILTER (WHERE device_type = 'tablet') as tablet,
                    COUNT(*) FILTER (WHERE device_type = 'unknown') as unknown
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2
                AND is_bot = false
                "#,
                start_date,
                end_date
            )
            .fetch_one(db)
            .await?;
            (
                result.mobile.unwrap_or(0),
                result.desktop.unwrap_or(0),
                result.tablet.unwrap_or(0),
                result.unknown.unwrap_or(0),
            )
        };

        Ok((mobile, desktop, tablet, unknown))
    }

    /// Get average session duration for analytics
    pub async fn get_average_session_duration(
        db: &PgPool,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        domain_name: Option<&str>,
    ) -> Result<f64, sqlx::Error> {
        let avg_duration = if let Some(domain) = domain_name {
            let result = sqlx::query!(
                r#"
                SELECT AVG(duration_seconds) as avg_duration
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2 
                AND domain_name = $3
                AND is_bot = false
                AND duration_seconds IS NOT NULL
                "#,
                start_date,
                end_date,
                domain
            )
            .fetch_one(db)
            .await?;
            result.avg_duration
        } else {
            let result = sqlx::query!(
                r#"
                SELECT AVG(duration_seconds) as avg_duration
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2
                AND is_bot = false
                AND duration_seconds IS NOT NULL
                "#,
                start_date,
                end_date
            )
            .fetch_one(db)
            .await?;
            result.avg_duration
        };

        Ok(avg_duration
            .and_then(|d| d.to_string().parse::<f64>().ok())
            .unwrap_or(0.0))
    }

    /// Get bounce rate for analytics
    pub async fn get_bounce_rate(
        db: &PgPool,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        domain_name: Option<&str>,
    ) -> Result<f64, sqlx::Error> {
        let (total, bounces) = if let Some(domain) = domain_name {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(*) FILTER (WHERE page_views <= 1) as bounce_sessions
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2 
                AND domain_name = $3
                AND is_bot = false
                "#,
                start_date,
                end_date,
                domain
            )
            .fetch_one(db)
            .await?;
            (
                result.total_sessions.unwrap_or(0),
                result.bounce_sessions.unwrap_or(0),
            )
        } else {
            let result = sqlx::query!(
                r#"
                SELECT 
                    COUNT(*) as total_sessions,
                    COUNT(*) FILTER (WHERE page_views <= 1) as bounce_sessions
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2
                AND is_bot = false
                "#,
                start_date,
                end_date
            )
            .fetch_one(db)
            .await?;
            (
                result.total_sessions.unwrap_or(0),
                result.bounce_sessions.unwrap_or(0),
            )
        };

        let total_f = total as f64;
        let bounces_f = bounces as f64;

        if total_f > 0.0 {
            Ok(bounces_f / total_f)
        } else {
            Ok(0.0)
        }
    }

    /// Get session count for analytics
    pub async fn get_session_count(
        db: &PgPool,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        domain_name: Option<&str>,
    ) -> Result<i64, sqlx::Error> {
        let session_count = if let Some(domain) = domain_name {
            let result = sqlx::query!(
                r#"
                SELECT COUNT(*) as session_count
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2 
                AND domain_name = $3
                AND is_bot = false
                "#,
                start_date,
                end_date,
                domain
            )
            .fetch_one(db)
            .await?;
            result.session_count.unwrap_or(0)
        } else {
            let result = sqlx::query!(
                r#"
                SELECT COUNT(*) as session_count
                FROM user_sessions 
                WHERE started_at BETWEEN $1 AND $2
                AND is_bot = false
                "#,
                start_date,
                end_date
            )
            .fetch_one(db)
            .await?;
            result.session_count.unwrap_or(0)
        };

        Ok(session_count)
    }
}
