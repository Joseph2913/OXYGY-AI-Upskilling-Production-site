import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    hasApiKey: !!process.env.OpenRouter_API,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
}
