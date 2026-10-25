import { FundamentalAnalysisService, CalendarFilterParams } from './fundamentalAnalysis.service';

export interface EconomicEventItem {
  id: string;
  title: string;
  country: string;
  currency: string;
  category?: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  eventTime: string;
  status?: 'SCHEDULED' | 'PUBLISHED' | 'REVISED' | 'CANCELLED';
  forecast?: string;
  previous?: string;
  revisedPrevious?: string;
  actual?: string;
  surpriseDirection?: string;
  sourceProvider?: string;
}

export class EconomicCalendarService {
  /**
   * Returns economic calendar events with full filtering and backward compatibility
   */
  public static async getEvents(
    startDate?: string,
    endDate?: string,
    extraFilters?: Omit<CalendarFilterParams, 'startDate' | 'endDate'>
  ): Promise<EconomicEventItem[]> {
    const records = await FundamentalAnalysisService.getCalendarEvents({
      startDate,
      endDate,
      ...extraFilters
    });

    return records.map((r) => ({
      id: r.id,
      title: r.title,
      country: r.country,
      currency: r.currency,
      category: r.category,
      impact: r.impact,
      eventTime: r.eventTime,
      status: r.status,
      forecast: r.forecastValue ?? undefined,
      previous: r.previousValue ?? undefined,
      revisedPrevious: r.revisedPreviousValue ?? undefined,
      actual: r.actualValue ?? undefined,
      surpriseDirection: r.surpriseDirection,
      sourceProvider: r.sourceProvider
    }));
  }
}
