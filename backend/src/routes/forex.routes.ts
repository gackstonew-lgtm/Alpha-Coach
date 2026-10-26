/**
 * Arcade Fx — Forex Intelligence & Market Data Routes
 * Provides endpoints for:
 * - GET /candles?symbol=&tf=&limit=
 * - GET /levels?symbol=
 * - GET /conditions?symbol=
 * - GET /stream?symbol= (SSE real-time stream)
 */

import { Router, Request, Response } from 'express';
import { ForexDataLayerService } from '../services/forexDataLayer.service';

const router = Router();

/**
 * GET /candles
 * Returns historical OHLCV bars formatted for TradingView Lightweight Charts
 */
router.get(['/candles', '/forex/candles'], async (req: Request, res: Response) => {
  try {
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const tf = String(req.query.tf || req.query.timeframe || 'H1').toUpperCase();
    const limit = Number(req.query.limit) || 500;

    const data = await ForexDataLayerService.getCandles({
      symbol,
      timeframe: tf,
      limit
    });

    res.json({
      success: true,
      ...data
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CANDLES_FETCH_ERROR',
        message: err.message || 'Failed to fetch forex candle data'
      }
    });
  }
});

/**
 * GET /levels
 * Returns Previous Day/Week/Month H/L/C, Today O/H/L, Classic Pivots, and Swing S/R
 */
router.get(['/levels', '/forex/levels'], async (req: Request, res: Response) => {
  try {
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const levels = await ForexDataLayerService.getPriceLevels(symbol);

    res.json({
      success: true,
      ...levels
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'LEVELS_FETCH_ERROR',
        message: err.message || 'Failed to calculate price levels'
      }
    });
  }
});

/**
 * GET /conditions
 * Returns Market Open/Closed, Sessions in UTC, Overlaps, Daily Change, ATR(14), and Trend
 */
router.get(['/conditions', '/forex/conditions'], async (req: Request, res: Response) => {
  try {
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const conditions = await ForexDataLayerService.getMarketConditions(symbol);

    res.json({
      success: true,
      ...conditions
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONDITIONS_FETCH_ERROR',
        message: err.message || 'Failed to calculate market conditions'
      }
    });
  }
});

/**
 * GET /quotes
 * Returns latest Bid, Ask, Spread quotes
 */
router.get(['/quotes', '/forex/quotes'], async (req: Request, res: Response) => {
  try {
    const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();
    const quote = await ForexDataLayerService.getLiveQuote(symbol);

    res.json({
      success: true,
      data: quote
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'QUOTE_FETCH_ERROR',
        message: err.message || 'Failed to fetch live quote'
      }
    });
  }
});

/**
 * GET /stream
 * Server-Sent Events (SSE) streaming endpoint for real-time Bid/Ask ticks and quote updates
 */
router.get(['/stream', '/forex/stream'], (req: Request, res: Response) => {
  const symbol = String(req.query.symbol || 'EURUSD').toUpperCase();

  // Set SSE HTTP Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable proxy buffering (Nginx, Vercel, Cloudflare)
  });

  // Keep-alive heartbeat interval every 15 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  // Register client
  ForexDataLayerService.addSseClient(symbol, res);

  req.on('close', () => {
    clearInterval(heartbeat);
    ForexDataLayerService.removeSseClient(symbol, res);
  });
});

export default router;
