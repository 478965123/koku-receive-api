
export interface User {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  role: 'staff' | 'admin';
  status: 'active' | 'inactive';
}

export interface Item {
  id: string;
  item_no: string;
  product_name: string;
  description?: string;
  category: string;
  status: 'active' | 'inactive';
}

export interface Receipt {
  id: string;
  receipt_no: string;
  qr_code?: string;
  item_id: string;
  user_id: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  received_at: string;
}

export interface Defect {
  id: string;
  receipt_id: string;
  defect_type: string;
  defect_description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  checklist_data?: any;
}

export interface Photo {
  id: string;
  receipt_id: string;
  defect_id?: string;
  photo_url: string;
  photo_type: 'general' | 'defect';
  uploaded_at: string;
}

// Request Payload Type
export interface CreateReceiptRequest {
  item_id: string; // Or find by QR
  user_id: string;
  qr_code?: string;
  quantity: number;
  location?: string;
  notes?: string;
  defects?: {
    type: string;
    description: string;
    severity?: string;
    checklist?: any;
  }[];
  photo_urls?: {
    url: string;
    type: 'general' | 'defect';
    defect_index?: number; // if related to specific defect in the array above
  }[];
}
