const http = require('http')

http.get('http://localhost:3000/api/landing-page?businessUnit=77313e61-2a19-4f3e-823b-80390dde8bd2&country=US&language=en', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const json = JSON.parse(data)
    const slide1 = json.landingPage?.hero_slides?.[0]
    console.log('Slide 1 has poster_url:', slide1?.poster_url || 'MISSING')
    if (slide1?.poster_url) {
      console.log('Poster URL:', slide1.poster_url)
    }
  })
})
