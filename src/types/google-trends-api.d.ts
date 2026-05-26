declare module "google-trends-api" {
  interface DailyTrendsOptions {
    geo?: string;
    trendDate?: Date;
    hl?: string;
  }
  interface InterestOptions {
    keyword: string | string[];
    geo?: string;
    startTime?: Date;
    endTime?: Date;
  }
  // All methods resolve to a raw JSON string.
  export function dailyTrends(opts: DailyTrendsOptions): Promise<string>;
  export function realTimeTrends(opts: DailyTrendsOptions & { category?: string }): Promise<string>;
  export function interestOverTime(opts: InterestOptions): Promise<string>;
  const _default: {
    dailyTrends: typeof dailyTrends;
    realTimeTrends: typeof realTimeTrends;
    interestOverTime: typeof interestOverTime;
  };
  export default _default;
}
