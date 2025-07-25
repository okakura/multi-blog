import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

class DataSection extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      'Data Section Error Boundary caught an error:',
      error,
      errorInfo,
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {this.props.fallbackTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Unable to load this section. Please try refreshing.
              </p>
              {this.props.onRetry && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default DataSection
