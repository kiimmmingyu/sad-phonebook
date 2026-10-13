export type Contact = {
  id: string;
  name: string;
  phone: string;
  group_name: string;
  memo: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactInput = {
  name: string;
  phone: string;
  group_name: string;
  memo: string;
  favorite: boolean;
};

export const DEFAULT_GROUPS = ["가족", "친구", "직장", "기타"] as const;
