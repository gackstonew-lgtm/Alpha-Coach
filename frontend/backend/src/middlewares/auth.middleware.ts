import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { BridgeService } from '../services/bridge.service';

export interface AuthenticatedRequest extends Request {
  requestId?: string;
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

export function attachRequestId(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}

export async function requireUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const reqId = req.requestId || uuidv4();

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required. No Bearer token provided.'
      },
      requestId: reqId
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = await AuthService.verifyTokenAsync(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_AUTH_TOKEN',
        message: 'Invalid or expired user authentication token.'
      },
      requestId: reqId
    });
    return;
  }

  req.user = payload;
  next();
}

export async function requireBridgeOrUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const bridgeToken = req.headers['x-bridge-token'] as string;
  const reqId = req.requestId || uuidv4();

  if (bridgeToken) {
    const authCheck = await BridgeService.checkDeviceAuth(bridgeToken);
    if (!authCheck.authorized || !authCheck.userId || !authCheck.deviceId) {
      const errCode = authCheck.error?.code || 'INVALID_BRIDGE_TOKEN';
      const errMsg = authCheck.error?.message || 'Invalid or inactive MT5 Bridge device token.';
      res.status(401).json({
        success: false,
        error: {
          code: errCode,
          message: errMsg
        },
        requestId: reqId
      });
      return;
    }
    req.bridgeDevice = {
      userId: authCheck.userId,
      deviceId: authCheck.deviceId,
      deviceName: authCheck.deviceName || 'Local Windows Terminal'
    };
    req.user = { userId: authCheck.userId, email: '', role: 'trader', tier: 'PRO' };
    next();
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = await AuthService.verifyTokenAsync(token);
    if (payload) {
      req.user = payload;
      next();
      return;
    }
  }

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Unauthorized. Provide either valid Bearer token or x-bridge-token header.'
    },
    requestId: reqId
  });
}

