import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../backend/src/server';
import { initDatabase } from '../backend/src/db/db';

let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!initialized) {
    try {
      await initDatabase();
      initialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] DB initialization warning:', err);
    }
  }

  // Pass request directly to Express application
  return app(req as any, res as any);
}
