const fetch = require('node-fetch')

async function showRooms() {
  const response = await fetch('http://localhost:3000/api/booking/rooms?businessUnitId=skincoach')
  const result = await response.json()
  const rooms = result.data || []

  console.log(`\nTotal rooms: ${rooms.length}\n`)
  console.log('Room Details:')
  console.log('='.repeat(80))

  rooms.forEach((r, i) => {
    console.log(`${i+1}. ${r.room_number} - ${r.room_name}`)
    console.log(`   Type: ${r.room_type || 'N/A'}`)
    console.log(`   Outlet: ${r.outlet_id || 'NOT ASSIGNED'}`)
    console.log(`   Created: ${r.created_at}`)
    console.log(`   ID: ${r.id}`)
    console.log('')
  })
}

showRooms()
