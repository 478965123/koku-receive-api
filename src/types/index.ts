export interface User {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  username: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  item_no: string;
  product_name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  receipt_no: string;
  item_id: string;
  user_id: string;
  quantity: number;
  defect_quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  received_at: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  receipt_id: string;
  photo_url: string;
  photo_type: 'general' | 'defect' | 'label' | 'package';
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

export interface Defect {
  id: string;
  receipt_id: string;
  defect_type: string;
  defect_description: string;
  quantity: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface ProductSubmission {
  id: string;
  employee_id: string;
  employee_name: string;
  product_type: string;
  qr_code: string;
  condition: string;
  defect_images: string[];
  created_at: string;
}
