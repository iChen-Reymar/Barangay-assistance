import { spawn } from 'node:child_process'

const api = spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' })
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' })

function shutdown() {
  api.kill()
  web.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

api.on('exit', (code) => {
  if (code && code !== 0) console.error(`API exited with code ${code}`)
})
