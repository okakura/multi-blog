import type React from 'react'
import { usePreferencesClasses } from '../hooks/usePreferencesClasses'

interface PreferencesWrapperProps {
  children: React.ReactNode
}

export const PreferencesWrapper: React.FC<PreferencesWrapperProps> = ({
  children,
}) => {
  const { getAppClasses } = usePreferencesClasses()

  return <div className={`min-h-screen ${getAppClasses()}`}>{children}</div>
}
