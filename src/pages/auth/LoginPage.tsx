import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react'

interface LoginPageProps {
  onSuccess?: () => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      await login(formData.email, formData.password)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4'>
      {/* Background decoration */}
      <div className='absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-white/10' />
      <div className='absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
      <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl' />

      <div className='relative z-10 w-full max-w-md'>
        {/* Logo/Header */}
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl'>
            <span className='text-white font-bold text-xl'>MB</span>
          </div>
          <h1 className='text-3xl font-bold text-white mb-2'>Welcome Back</h1>
          <p className='text-white/70'>Sign in to Multi-Blog Admin</p>
        </div>

        {/* Login Form */}
        <div className='bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-white/90 mb-2'>
                Email Address
              </label>
              <div className='relative'>
                <User
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60'
                  size={18}
                />
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className='w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300'
                  placeholder='Enter your email'
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-white/90 mb-2'>
                Password
              </label>
              <div className='relative'>
                <Lock
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60'
                  size={18}
                />
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className='w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300'
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors'>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className='bg-red-500/20 border border-red-500/30 rounded-lg p-3'>
                <p className='text-red-200 text-sm'>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'>
              {isLoading ? (
                <>
                  <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className='mt-6 pt-6 border-t border-white/20'>
            <p className='text-white/60 text-sm text-center mb-3'>
              Demo Credentials
            </p>
            <div className='bg-white/5 rounded-lg p-3 text-sm'>
              <div className='text-white/80 mb-1'>
                Email: admin@multi-blog.com
              </div>
              <div className='text-white/80'>Password: admin123</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center mt-8'>
          <p className='text-white/60 text-sm'>
            Secure admin access for Multi-Blog Platform
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
