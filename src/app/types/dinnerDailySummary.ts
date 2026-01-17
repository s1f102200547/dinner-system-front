export type DinnerDailySummary = {
  store_id: string;
  dateKey: string;
  total_sales: number;
  total_groups: number;
  total_guests: number;
  canceled_groups: number;
  canceled_guests: number;
  memo?: string;
};
