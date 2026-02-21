export type DinnerStatus = "coming" | "canceled" | "done";

export type DinnerCreatedBy = "gmail-listener_back" | "dinner_front";

export type DinnerOrderItem = {
  item_id: string;
  quantity: number;
};

export type DinnerItem = {
  id: string; // firebase auto id (doc id)
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

export type DinnerMenuItem = {
  item_id: string;
  item_name: string;
  price: number;
};

export type DinnerMenuById = Record<string, DinnerMenuItem>;
