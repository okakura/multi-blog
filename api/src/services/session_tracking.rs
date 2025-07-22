// src/services/session_tracking.rs
use axum::http::HeaderMap;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{
    PgPool, Row,
    types::{BigDecimal, ipnetwork::IpNetwork},
};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserSession {
    pub id: Uuid,
    pub session_id: String,
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
        session_id: &str,
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

    /// Calculate average session duration for a date range
    pub async fn get_average_session_duration(
        db: &PgPool,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        domain: Option<&str>,
    ) -> Result<f64, sqlx::Error> {
        let avg_duration = match domain {
            Some(domain_name) => {
                sqlx::query!(
                    r#"
                    SELECT AVG(
                        CASE 
                            WHEN duration_seconds IS NOT NULL THEN duration_seconds
                            ELSE EXTRACT(EPOCH FROM (last_activity_at - started_at))::INTEGER
                        END
                    ) as avg_duration
                    FROM user_sessions 
                    WHERE started_at BETWEEN $1 AND $2 
                    AND domain_name = $3
                    AND is_bot = FALSE
                    "#,
                    start_date,
                    end_date,
                    domain_name
                )
                .fetch_one(db)
                .await?
                .avg_duration
            }
            None => {
                sqlx::query!(
                    r#"
                    SELECT AVG(
                        CASE 
                            WHEN duration_seconds IS NOT NULL THEN duration_seconds
                            ELSE EXTRACT(EPOCH FROM (last_activity_at - started_at))::INTEGER
                        END
                    ) as avg_duration
                    FROM user_sessions 
                    WHERE started_at BETWEEN $1 AND $2 
                    AND is_bot = FALSE
                    "#,
                    start_date,
                    end_date
                )
                .fetch_one(db)
                .await?
                .avg_duration
            }
        };

        // Convert from seconds to minutes and handle BigDecimal to f64 conversion
        let avg_seconds = avg_duration.unwrap_or_else(|| BigDecimal::from(0));
        let avg_seconds_f64: f64 = avg_seconds.to_string().parse().unwrap_or(0.0);
        Ok(avg_seconds_f64 / 60.0)
    }

    /// Get device breakdown for analytics
    pub async fn get_device_breakdown(
        db: &PgPool,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
        domain: Option<&str>,
    ) -> Result<(i32, i32, i32, i32), sqlx::Error> {
        let (mobile, desktop, tablet, unknown) = match domain {
            Some(domain_name) => {
                let result = sqlx::query!(
                    r#"
                    SELECT 
                        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile,
                        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop,
                        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet,
                        COUNT(CASE WHEN device_type = 'unknown' THEN 1 END) as unknown
                    FROM user_sessions 
                    WHERE started_at BETWEEN $1 AND $2 
                    AND domain_name = $3
                    AND is_bot = FALSE
                    "#,
                    start_date,
                    end_date,
                    domain_name
                )
                .fetch_one(db)
                .await?;
                (result.mobile, result.desktop, result.tablet, result.unknown)
            }
            None => {
                let result = sqlx::query!(
                    r#"
                    SELECT 
                        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile,
                        COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop,
                        COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet,
                        COUNT(CASE WHEN device_type = 'unknown' THEN 1 END) as unknown
                    FROM user_sessions 
                    WHERE started_at BETWEEN $1 AND $2 
                    AND is_bot = FALSE
                    "#,
                    start_date,
                    end_date
                )
                .fetch_one(db)
                .await?;
                (result.mobile, result.desktop, result.tablet, result.unknown)
            }
        };

        Ok((
            mobile.unwrap_or(0) as i32,
            desktop.unwrap_or(0) as i32,
            tablet.unwrap_or(0) as i32,
            unknown.unwrap_or(0) as i32,
        ))
    }

    /// End a session (called when user leaves or session expires)
    pub async fn end_session(db: &PgPool, session_id: &str) -> Result<(), sqlx::Error> {
        // First get the session UUID
        let session_uuid = sqlx::query!(
            "SELECT id FROM user_sessions WHERE session_id = $1",
            session_id
        )
        .fetch_one(db)
        .await?
        .id;

        // Then call the end_session function
        sqlx::query!("SELECT end_session($1)", session_uuid)
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
}
