export type User = {
  id: string;
  email: string;
  role: "patient" | "admin" | "doctor";
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Prescription = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  prescription_number: string;
  status: "pending" | "approved" | "rejected";
  file_url: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  patient_id: string;
  prescription_id: string;
  status: "pending" | "processing" | "ready" | "delivered" | "cancelled";
  total_amount: number;
  payment_method: string | null;
  delivery_type: "pickup" | "delivery";
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  order_id: string | null;
  subject: string | null;
  body: string;
  read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, "id" | "created_at" | "updated_at">; Update: Partial<User> };
      user_profiles: { Row: UserProfile; Insert: Omit<UserProfile, "id" | "created_at" | "updated_at">; Update: Partial<UserProfile> };
      prescriptions: { Row: Prescription; Insert: Omit<Prescription, "id" | "created_at" | "updated_at">; Update: Partial<Prescription> };
      orders: { Row: Order; Insert: Omit<Order, "id" | "created_at" | "updated_at">; Update: Partial<Order> };
      messages: { Row: Message; Insert: Omit<Message, "id" | "created_at">; Update: Partial<Message> };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
