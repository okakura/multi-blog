import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react'
import { domainConfigs } from '../config/domains'
import type { DomainType, DomainConfig } from '../types'

interface DomainContextValue {
  currentDomain: DomainType
  config: DomainConfig
  setDomain: (d: DomainType) => void
  isSubdomainMode: boolean
  detectedDomain?: DomainType
  updateFromRoute: (domain?: string) => void
}

const DomainContext = createContext<DomainContextValue | undefined>(undefined)

export const useDomain = () => {
  const ctx = useContext(DomainContext)
  if (!ctx) throw new Error('useDomain must be used within DomainProvider')
  return ctx
}

export const DomainProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Detect subdomain from window.location.hostname
  const detectSubdomain = (): DomainType | undefined => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname
      const parts = host.split('.')
      if (parts.length > 2) {
        const sub = parts[0]
        if (sub === 'tech') return 'tech.blog'
        if (sub === 'lifestyle') return 'lifestyle.blog'
        if (sub === 'business') return 'business.blog'
      }
    }
    return undefined
  }

  const [detectedDomain, setDetectedDomain] = useState<DomainType | undefined>(
    detectSubdomain()
  )
  const [routeDomain, setRouteDomain] = useState<string | undefined>(undefined)

  // Determine current domain priority: URL param > subdomain > default
  const currentDomain = useMemo((): DomainType => {
    // 1. URL parameter (e.g., /blog/tech.blog)
    if (
      routeDomain &&
      ['tech.blog', 'lifestyle.blog', 'business.blog'].includes(routeDomain)
    ) {
      return routeDomain as DomainType
    }

    // 2. Subdomain detection (e.g., tech.yoursite.com)
    if (detectedDomain) {
      return detectedDomain
    }

    // 3. Default fallback
    return 'tech.blog'
  }, [routeDomain, detectedDomain])

  const isSubdomainMode = !!detectedDomain

  // Re-detect subdomain on mount
  useEffect(() => {
    setDetectedDomain(detectSubdomain())
  }, [])

  const config = useMemo(
    () => domainConfigs[currentDomain] || domainConfigs.default,
    [currentDomain]
  )

  const setDomain = (newDomain: DomainType) => {
    // In subdomain mode, changing domain would require a redirect
    // In path mode, we can navigate programmatically
    if (isSubdomainMode) {
      // For subdomain mode, we'd need to redirect to the new subdomain
      // This is a complex operation that would typically involve server-side routing
      console.warn(
        `Domain switching in subdomain mode requires server-side redirect to ${newDomain}`
      )
    } else {
      // For path mode, the parent component should handle navigation
      // We'll update the state for consistency but navigation should be handled externally
      console.log(`Domain change requested: ${newDomain}`)
      setRouteDomain(newDomain)
    }
  }

  // Function to update domain from route parameters (called by components inside Router)
  const updateFromRoute = (domain?: string) => {
    setRouteDomain(domain)
  }

  const value: DomainContextValue = {
    currentDomain,
    config,
    setDomain,
    isSubdomainMode,
    detectedDomain,
    updateFromRoute,
  }

  return (
    <DomainContext.Provider value={value}>{children}</DomainContext.Provider>
  )
}
