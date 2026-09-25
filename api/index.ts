import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../backend/src/app';
import { initDatabase } from '../backend/src/db/db';

let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!initialized) {
    try {
      await initDatabase();
      initialized = true;
    } catch (err) {
      console.warn('[Vercel Serverless] Database initialization warning:', err);
    }
  }

  return app(req as any, res as any);
}
