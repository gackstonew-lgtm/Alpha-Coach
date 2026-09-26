import app from '../backend/src/app';

export default function handler(req: any, res: any) {
  return new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    app(req, res);
  });
}
