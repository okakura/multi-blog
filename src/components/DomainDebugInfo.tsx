import React from 'react'
import { useDomain } from '../contexts/DomainContext'

const DomainDebugInfo: React.FC = () => {
  const { currentDomain, config, isSubdomainMode, detectedDomain } = useDomain()

  return (
    <div className='fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs'>
      <div className='font-bold mb-2'>Domain Debug Info</div>
      <div className='space-y-1'>
        <div>
          Current: <span className='text-yellow-400'>{currentDomain}</span>
        </div>
        <div>
          Mode:{' '}
          <span className='text-blue-400'>
            {isSubdomainMode ? 'Subdomain' : 'Path'}
          </span>
        </div>
        {detectedDomain && (
          <div>
            Detected: <span className='text-green-400'>{detectedDomain}</span>
          </div>
        )}
        <div>
          Config: <span className='text-purple-400'>{config.name}</span>
        </div>
        <div>
          Host:{' '}
          <span className='text-gray-400'>{window.location.hostname}</span>
        </div>
        <div>
          Path:{' '}
          <span className='text-gray-400'>{window.location.pathname}</span>
        </div>
      </div>
    </div>
  )
}

export default DomainDebugInfo
