import type { DinnerMenuById } from "@/app/types/dinner";

export const dummyDinnerMenuById: DinnerMenuById = {
  wagyu_course: {
    item_id: "wagyu_course",
    item_name: "和牛コース",
    price: 15000,
  },
  sake_pairing: {
    item_id: "sake_pairing",
    item_name: "日本酒ペアリング",
    price: 4000,
  },
  kids_course: {
    item_id: "kids_course",
    item_name: "キッズコース",
    price: 3000,
  },
  veg_course: {
    item_id: "veg_course",
    item_name: "ベジコース",
    price: 12000,
  },
};
