import { PositionReconstructionService } from '../src/services/reconstruction.service';
import { RawDeal } from '../src/models/types';

describe('PositionReconstructionService Unit Tests', () => {
  describe('Session Determination', () => {
    it('should correctly classify Asia session (00:00 - 07:00 UTC)', () => {
      expect(PositionReconstructionService.determineSession('2026-09-25T03:30:00Z')).toBe('Asia');
    });

    it('should correctly classify London session (07:00 - 13:00 UTC)', () => {
      expect(PositionReconstructionService.determineSession('2026-09-25T08:15:00Z')).toBe('London');
    });

    it('should correctly classify London/NY Overlap (13:00 - 16:00 UTC)', () => {
      expect(PositionReconstructionService.determineSession('2026-09-25T14:30:00Z')).toBe('London/NY Overlap');
    });

    it('should correctly classify New York session (16:00 - 21:00 UTC)', () => {
      expect(PositionReconstructionService.determineSession('2026-09-25T18:00:00Z')).toBe('New York');
    });

    it('should correctly classify Off-Hours (21:00 - 00:00 UTC)', () => {
      expect(PositionReconstructionService.determineSession('2026-09-25T22:45:00Z')).toBe('Off-Hours');
    });
  });

  describe('Exit Reason Determination', () => {
    it('should identify SL_HIT when comment mentions sl', () => {
      const deals: RawDeal[] = [
        {
          id: '1', account_id: 'a', deal_id: 'd1', order_id: 'o1', position_id: 'p1',
          symbol: 'EURUSD', type: 1, entry: 1, volume: 1.0, price: 1.0800,
          commission: -3, swap: 0, profit: -100, fee: 0, price_sl: 1.0800, price_tp: 1.0900,
          time: '2026-09-25T10:00:00Z', magic: 0, comment: '[sl 1.0800]', created_at: ''
        }
      ];
      expect(PositionReconstructionService.determineExitReason(deals, 1.0800, 1.0900, 'BUY')).toBe('SL_HIT');
    });

    it('should identify TP_HIT when comment mentions tp', () => {
      const deals: RawDeal[] = [
        {
          id: '1', account_id: 'a', deal_id: 'd1', order_id: 'o1', position_id: 'p1',
          symbol: 'EURUSD', type: 1, entry: 1, volume: 1.0, price: 1.0900,
          commission: -3, swap: 0, profit: 200, fee: 0, price_sl: 1.0800, price_tp: 1.0900,
          time: '2026-09-25T10:00:00Z', magic: 0, comment: '[tp 1.0900]', created_at: ''
        }
      ];
      expect(PositionReconstructionService.determineExitReason(deals, 1.0800, 1.0900, 'BUY')).toBe('TP_HIT');
    });

    it('should identify MANUAL when trader manually closes', () => {
      const deals: RawDeal[] = [
        {
          id: '1', account_id: 'a', deal_id: 'd1', order_id: 'o1', position_id: 'p1',
          symbol: 'EURUSD', type: 1, entry: 1, volume: 1.0, price: 1.0850,
          commission: -3, swap: 0, profit: 50, fee: 0, price_sl: 1.0800, price_tp: 1.0900,
          time: '2026-09-25T10:00:00Z', magic: 0, comment: 'manual close', created_at: ''
        }
      ];
      expect(PositionReconstructionService.determineExitReason(deals, 1.0800, 1.0900, 'BUY')).toBe('MANUAL');
    });
  });
});
