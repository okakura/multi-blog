import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LogoutConfirmModal from '../LogoutConfirmModal'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Users,
  Globe,
  Plus,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react'

//Admin Layout Component
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Posts', href: '/admin/posts', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Domains', href: '/admin/domains', icon: Globe },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Profile', href: '/admin/profile', icon: User },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setShowLogoutModal(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
        <div className='flex items-center justify-between h-16 px-6 border-b border-slate-200'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>MB</span>
            </div>
            <span className='text-xl font-bold text-slate-900'>
              Multi-Blog Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className='lg:hidden text-slate-500 hover:text-slate-700'>
            <X size={20} />
          </button>
        </div>

        <nav className='mt-6 px-3'>
          <div className='space-y-1'>
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActivePath(item.href)
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}>
                  <Icon className='mr-3 h-5 w-5' />
                  {item.name}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User menu at bottom */}
        <div className='absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200'>
          <div className='flex items-center space-x-3 mb-3'>
            <div className='w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center'>
              <User size={16} className='text-slate-600' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-slate-900 truncate'>
                {user?.name || 'Admin User'}
              </p>
              <p className='text-xs text-slate-500 truncate'>
                {user?.email || 'admin@multi-blog.com'}
              </p>
            </div>
          </div>
          <div className='space-y-2'>
            <button
              onClick={() => navigate('/')}
              className='w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'>
              <Globe className='mr-3 h-4 w-4' />
              Back to Site
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className='w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors'>
              <LogOut className='mr-3 h-4 w-4' />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64'>
        {/* Top navigation */}
        <div className='sticky top-0 z-30 flex h-16 bg-white border-b border-slate-200 shadow-sm'>
          <button
            onClick={() => setSidebarOpen(true)}
            className='px-4 text-slate-500 hover:text-slate-700 lg:hidden flex-shrink-0'>
            <Menu size={20} />
          </button>

          <div className='flex-1 flex items-center justify-between px-4 lg:px-6 min-w-0'>
            <div className='flex-1 flex items-center space-x-4 min-w-0'>
              <div className='max-w-lg w-full min-w-0'>
                <div className='relative'>
                  <Search
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 flex-shrink-0'
                    size={16}
                  />
                  <input
                    type='text'
                    placeholder='Search posts, analytics, users...'
                    className='w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm'
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-2 lg:space-x-4 flex-shrink-0'>
              <button className='relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex-shrink-0'>
                <Bell size={20} />
                <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
              </button>

              <button
                onClick={() => navigate('/admin/posts/new')}
                className='flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium'>
                <Plus size={16} />
                <span className='hidden sm:inline whitespace-nowrap'>
                  New Post
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1'>{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        userName={user?.name}
      />
    </div>
  )
}

export default AdminLayout
