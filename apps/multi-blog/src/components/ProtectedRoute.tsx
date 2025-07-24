import type React from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from '../pages/auth/LoginPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'editor' | 'viewer'
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'viewer',
  fallback,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-slate-600'>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return fallback || <LoginPage />
  }

  // Check role permissions
  // Platform admins have access to everything
  if (user?.role === 'platform_admin') {
    return <>{children}</>
  }

  // For domain users, check their domain permissions
  // For admin interface, they need at least one admin role in any domain
  if (requiredRole === 'admin') {
    const hasAdminAccess = user?.domain_permissions?.some(
      (perm) => perm.role === 'admin'
    )

    if (!hasAdminAccess) {
      return (
        <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
          <div className='text-center max-w-md mx-auto p-8'>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <span className='text-red-600 text-2xl'>🚫</span>
            </div>
            <h1 className='text-2xl font-bold text-slate-900 mb-2'>
              Access Denied
            </h1>
            <p className='text-slate-600 mb-4'>
              You don't have permission to access this area. Administrative
              access required.
            </p>
            <p className='text-sm text-slate-500'>
              Your current role: {user?.role}
            </p>
          </div>
        </div>
      )
    }
  }

  // Check other role requirements (editor, viewer)
  const roleHierarchy = {
    viewer: 1,
    editor: 2,
    admin: 3,
  }

  // For domain users, get their highest permission level
  const userMaxPermission =
    user?.domain_permissions?.reduce((maxRole, perm) => {
      const permLevel =
        roleHierarchy[perm.role as keyof typeof roleHierarchy] || 0
      const currentMax =
        roleHierarchy[maxRole as keyof typeof roleHierarchy] || 0
      return permLevel > currentMax ? perm.role : maxRole
    }, 'viewer') || 'viewer'

  const userRoleLevel =
    roleHierarchy[userMaxPermission as keyof typeof roleHierarchy] || 1
  const requiredRoleLevel = roleHierarchy[requiredRole]

  if (userRoleLevel < requiredRoleLevel) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-8'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-red-600 text-2xl'>🚫</span>
          </div>
          <h1 className='text-2xl font-bold text-slate-900 mb-2'>
            Access Denied
          </h1>
          <p className='text-slate-600 mb-4'>
            You don't have permission to access this area. Required role:{' '}
            {requiredRole}
          </p>
          <p className='text-sm text-slate-500'>
            Your current role: {user?.role}
          </p>
        </div>
      </div>
    )
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

export default ProtectedRoute
