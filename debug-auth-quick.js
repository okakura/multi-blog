// Quick debug: run this in browser console to check auth
console.log('=== Auth Debug ===')
console.log('Token:', localStorage.getItem('auth_token'))
console.log('User:', localStorage.getItem('user'))

// Test what domain works
const token = localStorage.getItem('auth_token')
if (token) {
  console.log('Testing analytics with different domains...')

  const testDomains = ['tech.blog', 'tech.localhost', 'localhost']

  testDomains.forEach((domain) => {
    console.log(`Testing domain: ${domain}`)

    fetch('http://localhost:8000/analytics/overview', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Domain': domain,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        console.log(`${domain}: Status ${response.status}`)
        return response.json().catch(() => response.text())
      })
      .then((data) => {
        console.log(`${domain}: Response:`, data)
      })
      .catch((err) => {
        console.log(`${domain}: Error:`, err)
      })
  })
} else {
  console.log('No auth token found - please login first')
}
