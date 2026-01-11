export type ReservationRow = {
  id: string;
  guest_name?: string | null;
  adult_count?: number | null;
  child_count?: number | null;
  dinner?: number | null;
  dinner_time?: string | Array<string | null> | null;
  check_in_date?: string | null; // YYYY-MM-DD
};

