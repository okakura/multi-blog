import {
  AlertCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Upload,
  X,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useState } from 'react'

interface ImageUploadProps {
  onImageSelect: (url: string) => void
  onClose: () => void
  isOpen: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onClose,
  isOpen,
}) => {
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url')
  const [error, setError] = useState('')

  const handleUrlSubmit = useCallback(() => {
    if (!url.trim()) {
      setError('Please enter a valid image URL')
      return
    }

    // Basic URL validation
    try {
      new URL(url)
      onImageSelect(url)
      setUrl('')
      setError('')
      onClose()
    } catch {
      setError('Please enter a valid URL')
    }
  }, [url, onImageSelect, onClose])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      setUploading(true)
      setError('')

      try {
        // For now, we'll use a base64 data URL
        // In a real application, you'd upload to a cloud service like Cloudinary, AWS S3, etc.
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          onImageSelect(dataUrl)
          setUploading(false)
          onClose()
        }
        reader.onerror = () => {
          setError('Failed to read the image file')
          setUploading(false)
        }
        reader.readAsDataURL(file)
      } catch (_err) {
        setError('Failed to upload image')
        setUploading(false)
      }
    },
    [onImageSelect, onClose],
  )

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && activeTab === 'url') {
        handleUrlSubmit()
      }
    },
    [handleUrlSubmit, activeTab],
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-purple-600" />
            Add Image
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'url'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            From URL
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload File
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {error && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!url.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Image
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload an image'}
                  </p>
                  <p className="text-sm text-slate-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>
              {error && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageUpload
