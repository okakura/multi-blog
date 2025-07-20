import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Shield, Save, X } from 'lucide-react'

const UserProfile: React.FC = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })

  const handleSave = () => {
    // In a real app, this would update the user profile via API
    console.log('Saving user profile:', formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    })
    setIsEditing(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'editor':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return (
      <div className='p-6'>
        <div className='text-center'>
          <p className='text-slate-500'>No user information available</p>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <div className='bg-white rounded-lg shadow-sm border border-slate-200'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-slate-200'>
          <h1 className='text-2xl font-bold text-slate-900'>
            Profile Settings
          </h1>
          <p className='text-slate-600 mt-1'>
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Content */}
        <div className='p-6'>
          <div className='flex items-start space-x-6'>
            {/* Avatar */}
            <div className='flex-shrink-0'>
              <div className='w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center'>
                <User size={32} className='text-white' />
              </div>
            </div>

            {/* User Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h2 className='text-xl font-semibold text-slate-900'>
                    {user.name}
                  </h2>
                  <div className='flex items-center space-x-2 mt-1'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}>
                      <Shield className='w-3 h-3 mr-1' />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className='px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors'>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* Form */}
              <div className='space-y-4'>
                {/* Name Field */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type='text'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    />
                  ) : (
                    <div className='flex items-center space-x-2 py-2'>
                      <User size={16} className='text-slate-400' />
                      <span className='text-slate-900'>{user.name}</span>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type='email'
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    />
                  ) : (
                    <div className='flex items-center space-x-2 py-2'>
                      <Mail size={16} className='text-slate-400' />
                      <span className='text-slate-900'>{user.email}</span>
                    </div>
                  )}
                </div>

                {/* Role Field (Read-only) */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Role
                  </label>
                  <div className='flex items-center space-x-2 py-2'>
                    <Shield size={16} className='text-slate-400' />
                    <span className='text-slate-900'>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    <span className='text-xs text-slate-500'>
                      (Contact admin to change role)
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className='flex items-center space-x-3 pt-4'>
                    <button
                      onClick={handleSave}
                      className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors'>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className='flex items-center space-x-2 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors'>
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
