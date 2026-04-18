import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

// Run clone-site.mjs in background, stream its output to a log file so the
// admin UI can poll progress.
export async function POST(request: NextRequest) {
  try {
    const { url, businessUnit, country = 'US', language = 'en' } = await request.json()

    if (!url || !businessUnit) {
      return NextResponse.json({ error: 'url and businessUnit are required' }, { status: 400 })
    }

    // Simple URL validation
    try { new URL(url) } catch {
      return NextResponse.json({ error: 'invalid URL' }, { status: 400 })
    }

    const jobId = `clone-${Date.now()}`
    const logDir = path.join(process.cwd(), 'tmp', 'clone-jobs')
    if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })
    const logPath = path.join(logDir, `${jobId}.log`)
    writeFileSync(logPath, `# Clone job ${jobId}\nURL: ${url}\nBU: ${businessUnit}\n${country}/${language}\n\n`)

    // Spawn the script detached — run async so the HTTP response is immediate
    const child = spawn('node', [
      'scripts/clone-site.mjs',
      '--url', url,
      '--bu', businessUnit,
      '--country', country,
      '--lang', language,
    ], { cwd: process.cwd(), detached: false, stdio: ['ignore', 'pipe', 'pipe'] })

    const fs = await import('fs')
    const out = fs.createWriteStream(logPath, { flags: 'a' })
    child.stdout.pipe(out)
    child.stderr.pipe(out)
    child.on('exit', (code) => {
      out.write(`\n[exit ${code}] ${new Date().toISOString()}\n`)
      out.end()
    })
    child.unref()

    return NextResponse.json({ success: true, jobId, logPath: `/api/clone-site/log?jobId=${jobId}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'internal error' }, { status: 500 })
  }
}
