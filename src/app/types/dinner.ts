export type DinnerStatus = "coming" | "canceled" | "done";
export type DinnerOrigin = "dinner-system-front" | "ryokan-system-front";

export type DinnerCreatedBy = "gmail-listener_back" | "dinner_front";

export type DinnerOrderItem = {
  item_id: string;
  quantity: number;
};

export type DinnerItem = {
  id: string; // firebase auto id (doc id)
  origin: DinnerOrigin;
  dateKey: string; // yyyy-mm-dd
  status: DinnerStatus;
  dinner_customer_name: string;
  dinner_adult_count: number;
  dinner_child_count: number;
  dinner_time: Date | null;
  items?: DinnerOrderItem[];
  memo: string;
  created_by: DinnerCreatedBy;
  created_at: Date;
  updated_at: Date;
};

export type DinnerByDate = Record<string, Record<string, DinnerItem>>;

export type GuestInfoV2DinnerTime = string | null;

export type GuestInfoV2Reservation = {
  dinner: 1 | 0;
  dinner_time: GuestInfoV2DinnerTime[];
  cancel?: 1 | 0;
  check_in_date: string; // yyyy/mm/dd
  check_out_date: string; // yyyy/mm/dd
  adult_count: number;
  child_count: number;
  guest_name: string;
};

export type GuestInfoV2ByReservationNumber = Record<string, GuestInfoV2Reservation>;
