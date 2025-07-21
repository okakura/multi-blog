// Toast notification utilities
import toast from 'react-hot-toast'

interface ToastOptions {
  duration?: number
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
}

export const showToast = {
  // Success notifications
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
    })
  },

  // Error notifications
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
    })
  },

  // Loading notifications
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      position: options?.position || 'top-right',
    })
  },

  // Info notifications (custom)
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      icon: 'ℹ️',
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: '#3b82f6',
        color: '#ffffff',
      },
    })
  },

  // Warning notifications (custom)
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      icon: '⚠️',
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: {
        background: '#f59e0b',
        color: '#ffffff',
      },
    })
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss()
  },

  // Dismiss specific toast
  dismiss: (toastId: string) => {
    toast.dismiss(toastId)
  },

  // Promise-based toasts (for async operations)
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, {
      position: options?.position || 'top-right',
      success: {
        duration: options?.duration || 3000,
      },
      error: {
        duration: options?.duration || 5000,
      },
    })
  },

  // Custom toast with custom styling
  custom: (
    message: string,
    options?: ToastOptions & {
      icon?: string
      style?: React.CSSProperties
    }
  ) => {
    return toast(message, {
      icon: options?.icon,
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: options?.style,
    })
  },
}

// Admin-specific toast notifications
export const adminToast = {
  // Post operations
  postCreated: (title: string) =>
    showToast.success(`Post "${title}" created successfully! 🎉`),

  postUpdated: (title: string) =>
    showToast.success(`Post "${title}" updated successfully! ✨`),

  postDeleted: (title: string) =>
    showToast.success(`Post "${title}" deleted successfully! 🗑️`),

  postPublished: (title: string) =>
    showToast.success(`Post "${title}" published successfully! 🚀`),

  postUnpublished: (title: string) =>
    showToast.info(`Post "${title}" unpublished! 📝`),

  // Data operations
  dataRefreshed: () => showToast.success('Data refreshed successfully! 🔄'),

  analyticsUpdated: () => showToast.success('Analytics updated! 📊'),

  // User operations
  profileUpdated: () => showToast.success('Profile updated successfully! 👤'),

  settingsSaved: () => showToast.success('Settings saved successfully! ⚙️'),

  // Error states
  networkError: () =>
    showToast.error('Network error. Please check your connection! 🌐'),

  authError: () =>
    showToast.error('Authentication error. Please log in again! 🔐'),

  permissionError: () => showToast.error('Permission denied! 🚫'),

  // Loading states
  saving: () => showToast.loading('Saving changes...'),

  loading: (action: string) => showToast.loading(`${action}...`),

  deleting: () => showToast.loading('Deleting...'),
}

// Blog-specific toast notifications
export const blogToast = {
  // Search and navigation
  searchCompleted: (query: string, results: number) =>
    showToast.info(`Found ${results} results for "${query}" 🔍`),

  noResults: (query: string) =>
    showToast.warning(`No results found for "${query}" 😔`),

  // Sharing and interactions
  linkCopied: () => showToast.success('Link copied to clipboard! 📋'),

  subscribed: () => showToast.success('Successfully subscribed! 📧'),

  // Errors
  loadError: () =>
    showToast.error('Failed to load content. Please try again! 😞'),
}

export default showToast
