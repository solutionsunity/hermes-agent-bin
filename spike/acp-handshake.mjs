// Speaks ACP to a payload's hermes-acp over stdio: initialize, then
// session/new with no MCP servers. Prints what the agent answers; exits
// non-zero only if initialize gets no result.
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

const payload = resolve(process.argv[2])
const manifest = JSON.parse(readFileSync(join(payload, 'manifest.json'), 'utf8'))
const home = mkdtempSync(join(tmpdir(), 'acp-home-'))
const agent = spawn(resolve(payload, manifest.runtime.commands['hermes-acp']), [], {
  cwd: home,
  env: { PATH: process.env.PATH, HOME: home, USERPROFILE: home, HERMES_HOME: join(home, '.hermes') },
  stdio: ['pipe', 'pipe', 'inherit'],
})

const pending = new Map()
createInterface({ input: agent.stdout }).on('line', (line) => {
  let message
  try { message = JSON.parse(line) } catch { return console.log(`(non-JSON stdout) ${line}`) }
  if (message.id !== undefined && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  } else {
    console.log(`← ${line.slice(0, 400)}`)
  }
})

let next = 1
function request(method, params) {
  const id = next++
  agent.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  return new Promise((done, fail) => {
    pending.set(id, done)
    setTimeout(() => fail(new Error(`${method}: no answer in 60s`)), 60000).unref()
  })
}

const started = Date.now()
try {
  const init = await request('initialize', {
    protocolVersion: 1,
    clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
  })
  console.log(`initialize (${Date.now() - started} ms): ${JSON.stringify(init.result ?? init.error)}`)
  if (!init.result) process.exitCode = 1
  const session = await request('session/new', { cwd: home, mcpServers: [] })
  console.log(`session/new: ${JSON.stringify(session.result ?? session.error).slice(0, 600)}`)
} catch (error) {
  console.log(`handshake: ${error.message}`)
  process.exitCode = 1
} finally {
  agent.kill()
}
