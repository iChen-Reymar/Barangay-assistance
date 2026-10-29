import { spawn } from 'node:child_process'

const api = spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' })
const web = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' })

// The ML service is a separate Python process. It is optional: if Python or the
// packages are missing, the web app falls back to local rule-based scoring and
// says so on the ML Model Performance page. Failures are logged, never fatal.
let ml = null
try {
  ml = spawn('python', ['app.py'], {
    cwd: 'ml-service',
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  ml.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`ML service exited with code ${code}. Falling back to rule-based scoring.`)
    }
  })
} catch (error) {
  console.error('ML service could not start. Falling back to rule-based scoring.', error.message)
}

function shutdown() {
  api.kill()
  web.kill()
  if (ml) ml.kill()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

api.on('exit', (code) => {
  if (code && code !== 0) console.error(`API exited with code ${code}`)
})
web.on('exit', (code) => {
  if (code && code !== 0) console.error(`Web exited with code ${code}`)
})
