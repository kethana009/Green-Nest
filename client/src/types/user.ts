export interface IAddress {
  id: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface IProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
  saved_addresses: IAddress[];
  created_at: string;
  updated_at: string;
}
