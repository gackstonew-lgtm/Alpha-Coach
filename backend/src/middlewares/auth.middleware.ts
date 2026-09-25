import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { BridgeService } from '../services/bridge.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    tier: string;
  };
  bridgeDevice?: {
    userId: string;
    deviceId: string;
    deviceName: string;
  };
}

export function requireUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = AuthService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
    return;
  }

  req.user = payload;
  next();
}

export async function requireBridgeOrUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const bridgeToken = req.headers['x-bridge-token'] as string;

  if (bridgeToken) {
    const device = await BridgeService.validateDeviceToken(bridgeToken);
    if (!device) {
      res.status(401).json({ error: 'Invalid or inactive MT5 Bridge device token.' });
      return;
    }
    req.bridgeDevice = device;
    req.user = { userId: device.userId, email: '', role: 'trader', tier: 'PRO' };
    next();
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);
    if (payload) {
      req.user = payload;
      next();
      return;
    }
  }

  res.status(401).json({ error: 'Unauthorized. Provide either Bearer token or x-bridge-token header.' });
}
