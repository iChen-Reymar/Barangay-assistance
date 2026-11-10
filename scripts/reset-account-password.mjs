import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(rootDir, '.env')

function loadEnvFile() {
  if (!fs.existsSync(envPath)) throw new Error('Missing .env file.')
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separator = trimmed.indexOf('=')
    if (separator < 0) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

async function askEmail() {
  const argument = String(process.argv[2] || '').trim().toLowerCase()
  if (argument) return argument
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await prompt.question('Account email: ')).trim().toLowerCase()
  } finally {
    prompt.close()
  }
}

function askHidden(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !process.stdin.setRawMode) {
    return Promise.reject(new Error('Run this command in an interactive terminal.'))
  }

  return new Promise((resolve, reject) => {
    let value = ''
    process.stdout.write(label)
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const finish = (error) => {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) reject(error)
      else resolve(value)
    }

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') return finish(new Error('Password reset cancelled.'))
        if (character === '\r' || character === '\n') return finish()
        if (character === '\u007f' || character === '\b') {
          if (value) {
            value = value.slice(0, -1)
            process.stdout.write('\b \b')
          }
          continue
        }
        if (character >= ' ') {
          value += character
          process.stdout.write('*')
        }
      }
    }

    process.stdin.on('data', onData)
  })
}

async function findAuthUser(client, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) return match
    if (data.users.length < 200) return null
  }
}

async function main() {
  loadEnvFile()
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !secret) throw new Error('VITE_SUPABASE_URL and SUPABASE_SECRET_KEY are required in .env.')

  const email = await askEmail()
  if (!email.includes('@')) throw new Error('Enter the complete account email address.')
  const password = await askHidden('New password: ')
  if (password.length < 8) throw new Error('Password must contain at least 8 characters.')
  const confirmation = await askHidden('Confirm password: ')
  if (password !== confirmation) throw new Error('Passwords do not match.')

  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const account = await findAuthUser(client, email)
  if (!account) throw new Error('No Supabase Auth account uses that email address.')

  const { error } = await client.auth.admin.updateUserById(account.id, { password })
  if (error) throw error
  console.log(`Password updated for ${email}.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
