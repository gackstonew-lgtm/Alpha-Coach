import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthService, isTransientAuthFailureReason } from '../services/auth.service';
import { BridgeService } from '../services/bridge.service';

export interface AuthenticatedRequest extends Request {
  requestId?: string;
  user?: {
    userId: string;
    supabaseUserId?: string;
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

/**
 * Canonical user authentication middleware.
 * Verifies Supabase Auth Bearer token and attaches verified application identity.
 */
export async function requireUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const reqId = req.requestId || uuidv4();

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AUTH 401] reqId=${reqId} ${req.method} ${req.originalUrl} - Reason: SUPABASE_TOKEN_MISSING`);
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
  const authResult = await AuthService.verifyTokenDetailed(token);
  if (!authResult.valid || !authResult.user) {
    const reason = authResult.failureReason || 'SUPABASE_TOKEN_INVALID';

    // Transient failures (network/timeout contacting Supabase, missing backend config, or a
    // verified-but-unsynced DB record) are NOT proof the token is invalid. Return 503 so
    // clients treat this as "try again" rather than "log the user out" — this is what
    // prevents a transient hiccup from becoming a re-authentication loop on flows like
    // MT5 bridge pairing authorization.
    if (isTransientAuthFailureReason(reason)) {
      console.error(`[AUTH 503] reqId=${reqId} ${req.method} ${req.originalUrl} - Transient auth verification failure: ${reason}`);
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable while verifying your session. Your login is valid — please try again in a moment.'
        },
        requestId: reqId
      });
      return;
    }

    console.warn(`[AUTH 401] reqId=${reqId} ${req.method} ${req.originalUrl} - Reason: ${reason}`);
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

  req.user = authResult.user;
  next();
}

// Alias to guarantee compatibility with canonical naming
export const requireAuthenticatedUser = requireUserAuth;

/**
 * Dual authentication middleware for endpoints supporting either local MT5 Bridge device tokens or Web Users.
 */
export async function requireBridgeOrUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const bridgeToken = req.headers['x-bridge-token'] as string;
  const reqId = req.requestId || uuidv4();

  if (bridgeToken) {
    const authCheck = await BridgeService.checkDeviceAuth(bridgeToken);
    if (!authCheck.authorized || !authCheck.userId || !authCheck.deviceId) {
      const errCode = authCheck.error?.code || 'INVALID_BRIDGE_TOKEN';
      const errMsg = authCheck.error?.message || 'Invalid or inactive MT5 Bridge device token.';
      console.warn(`[BRIDGE AUTH 401] reqId=${reqId} ${req.method} ${req.originalUrl} - Reason: ${errCode}`);
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
    req.user = { userId: authCheck.userId, supabaseUserId: authCheck.userId, email: '', role: 'trader', tier: 'PRO' };
    next();
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const authResult = await AuthService.verifyTokenDetailed(token);
    if (authResult.valid && authResult.user) {
      req.user = authResult.user;
      next();
      return;
    }
    const reason = authResult.failureReason || 'SUPABASE_TOKEN_INVALID';
    if (isTransientAuthFailureReason(reason)) {
      console.error(`[AUTH 503] reqId=${reqId} ${req.method} ${req.originalUrl} - Transient auth verification failure: ${reason}`);
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable. Your session is valid — please try again in a moment.'
        },
        requestId: reqId
      });
      return;
    }
    console.warn(`[AUTH 401] reqId=${reqId} ${req.method} ${req.originalUrl} - Reason: ${reason}`);
  } else {
    console.warn(`[AUTH 401] reqId=${reqId} ${req.method} ${req.originalUrl} - Reason: CREDENTIALS_MISSING`);
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

