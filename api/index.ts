import { app } from '../backend/src/app';
import { initDatabase } from '../backend/src/db/db';

let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    try {
      await initDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('[Vercel Serverless Init Error]:', err);
    }
  }
  return app(req, res);
}
