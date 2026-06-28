export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
}

export interface IOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_snapshot: Record<string, any>;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface IOrder {
  id: string;
  user_id: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee: number;
  payment_method: 'cod' | 'dummy_card';
  payment_status: 'pending' | 'completed' | 'failed';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: IShippingAddress;
  invoice_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: IOrderItem[];
  profiles?: {
    full_name: string;
    email: string;
  };
}
