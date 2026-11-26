require('dotenv').config()
const mongoose = require('mongoose')

async function promoteAdmin() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) throw new Error('Usage: npm run promote-admin -- person@example.com')
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event-management')
  const result = await mongoose.connection.collection('users').updateOne({ email }, { $set: { role: 'admin', isActive: true } })
  if (!result.matchedCount) throw new Error(`No account found for ${email}. Register the account first.`)
  process.stdout.write(`Admin access granted to ${email}.\n`)
  await mongoose.disconnect()
}

promoteAdmin().catch(async (error) => {
  process.stderr.write(`${error.message}\n`)
  if (mongoose.connection.readyState) await mongoose.disconnect()
  process.exitCode = 1
})
