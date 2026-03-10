import type { VercelRequest, VercelResponse } from '@vercel/node'

const startTime = Date.now()

export default function handler(req: VercelRequest, res: VercelResponse) {
  const expectedSecret = process.env.HEALTH_SECRET
  const providedSecret = req.query.secret as string | undefined

  if (expectedSecret && providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const uptimeMs = Date.now() - startTime

  return res.status(200).json({
    status: 'ok',
    service: 'pixframe-web',
    uptime: Math.floor(uptimeMs / 1000),
    version: process.env.npm_package_version || '2.1.0',
    timestamp: new Date().toISOString()
  })
}
