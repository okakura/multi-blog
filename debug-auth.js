// Debug script to check authentication info
console.log('=== Authentication Debug Info ===')
console.log('Auth token:', localStorage.getItem('auth_token'))
console.log('User info:', localStorage.getItem('user'))
console.log('Domain info:', localStorage.getItem('domain'))

// Check what keys exist in localStorage
console.log('All localStorage keys:', Object.keys(localStorage))

// Test if we can manually call an analytics endpoint
if (localStorage.getItem('auth_token')) {
  const token = localStorage.getItem('auth_token')

  // Test with different domains
  const domains = ['tech.localhost', 'tech.blog', 'localhost']

  domains.forEach((domain) => {
    console.log(`Testing analytics with domain: ${domain}`)

    fetch('http://localhost:8000/analytics/overview', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Domain': domain,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        console.log(`Domain ${domain} - Status:`, response.status)
        if (response.status === 200) {
          return response.json()
        } else {
          return response.text()
        }
      })
      .then((data) => {
        console.log(`Domain ${domain} - Response:`, data)
      })
      .catch((err) => {
        console.log(`Domain ${domain} - Error:`, err)
      })
  })
}
