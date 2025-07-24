export interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  readingWidth: 'narrow' | 'medium' | 'wide'
  animations: boolean
  compactMode: boolean
}

export interface ContentPreferences {
  defaultEditor: 'rich-text' | 'markdown' | 'html'
  autoSaveInterval: 30 | 60 | 120 | 300 // seconds
  postsPerPage: 5 | 10 | 25 | 50 | 100
  defaultStatus: 'draft' | 'published'
  readingMode: 'excerpts' | 'full' | 'cards'
  imageQuality: 'auto' | 'high' | 'medium' | 'low'
}

export interface NotificationPreferences {
  comments: 'email' | 'browser' | 'none'
  mentions: 'email' | 'browser' | 'none'
  systemUpdates: 'email' | 'browser' | 'none'
  weeklyDigest: boolean
  timing: 'immediate' | 'hourly' | 'daily'
}

export interface DashboardPreferences {
  defaultView: 'overview' | 'posts' | 'analytics' | 'recent-activity'
  analyticsLevel: 'basic' | 'advanced'
  chartType: 'line' | 'bar' | 'pie'
  dateRange: '7-days' | '30-days' | '90-days'
  showAdminMetrics: boolean
}

export interface LocalizationPreferences {
  language: 'en' | 'es' | 'fr' | 'de'
  timezone: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12-hour' | '24-hour'
  numberFormat: '1,000.00' | '1.000,00' | '1 000,00'
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'contacts'
  showOnlineStatus: boolean
  activityTracking: boolean
  sessionTimeout: '30min' | '1hr' | '4hr' | 'never'
}

export interface AccessibilityPreferences {
  mobileEditor: 'simplified' | 'full'
  touchGestures: boolean
  highContrast: boolean
  screenReader: boolean
  keyboardNav: boolean
}

export interface UserPreferences {
  appearance: AppearancePreferences
  content: ContentPreferences
  notifications: NotificationPreferences
  dashboard: DashboardPreferences
  localization: LocalizationPreferences
  privacy: PrivacyPreferences
  accessibility: AccessibilityPreferences
}

export interface ExpandedSections {
  appearance: boolean
  content: boolean
  notifications: boolean
  dashboard: boolean
  localization: boolean
  privacy: boolean
  accessibility: boolean
}

export type PreferenceCategory = keyof UserPreferences
export type PreferenceKey<T extends PreferenceCategory> =
  keyof UserPreferences[T]
