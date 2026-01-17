export type DinnerStatus = "coming" | "canceled";

export type DinnerCreatedBy = "gmail-listener_back" | "dinner_front";

export type DinnerItem = {
  id: string; // firebase auto id (doc id)
  dateKey: string; // yyyy-mm-dd
  status: DinnerStatus;
  dinner_customer_name: string;
  dinner_adult_count: number;
  dinner_child_count: number;
  dinner_time: Date | null;
  memo: string;
  created_by: DinnerCreatedBy;
  created_at: Date;
  updated_at: Date;
};

export type DinnerShift = {
  staff_id: string;
  staff_name: string;
  start_time: Date;
  end_time: Date;
};

export type DinnerByDateEntry = {
  shifts: DinnerShift[];
  guests: Record<string, DinnerItem>;
};

export type DinnerByDate = Record<string, DinnerByDateEntry>;
