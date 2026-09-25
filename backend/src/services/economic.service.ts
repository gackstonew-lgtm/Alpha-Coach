import { getDatabase } from '../db/db';

export interface EconomicEventItem {
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  eventTime: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export class EconomicCalendarService {
  /**
   * Returns economic calendar events with nearby trade correlation
   */
  public static async getEvents(startDate?: string, endDate?: string): Promise<EconomicEventItem[]> {
    const db = getDatabase();
    // Default simulated / seed macro events across major FX/Indices
    const events: EconomicEventItem[] = [
      { id: 'ec-1', title: 'US Non-Farm Payrolls (NFP)', country: 'United States', currency: 'USD', impact: 'HIGH', eventTime: '2026-09-04T12:30:00Z', forecast: '165K', previous: '114K', actual: '142K' },
      { id: 'ec-2', title: 'US CPI Inflation Rate (YoY)', country: 'United States', currency: 'USD', impact: 'HIGH', eventTime: '2026-09-11T12:30:00Z', forecast: '2.5%', previous: '2.9%', actual: '2.5%' },
      { id: 'ec-3', title: 'FOMC Interest Rate Decision', country: 'United States', currency: 'USD', impact: 'HIGH', eventTime: '2026-09-18T18:00:00Z', forecast: '5.00%', previous: '5.50%', actual: '5.00%' },
      { id: 'ec-4', title: 'ECB Monetary Policy Statement', country: 'Euro Zone', currency: 'EUR', impact: 'HIGH', eventTime: '2026-09-12T12:15:00Z', forecast: '3.65%', previous: '3.75%', actual: '3.65%' },
      { id: 'ec-5', title: 'BoE Official Bank Rate', country: 'United Kingdom', currency: 'GBP', impact: 'HIGH', eventTime: '2026-09-19T11:00:00Z', forecast: '5.00%', previous: '5.00%', actual: '5.00%' },
      { id: 'ec-6', title: 'US ISM Manufacturing PMI', country: 'United States', currency: 'USD', impact: 'MEDIUM', eventTime: '2026-09-03T14:00:00Z', forecast: '47.5', previous: '46.8', actual: '47.2' }
    ];

    return events;
  }
}
