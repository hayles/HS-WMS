export interface Customer {
  id?: number;
  name: string;
  contact_info?: string;
  products?: Product[];
}

export interface Product {
  id?: number;
  sku_code: string;
  name: string;
  description?: string;
}

export interface InventoryItem {
  id?: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  target_stock?: number;
  safety_stock?: number;
  updated_at?: string;
  customer?: Customer;
  product?: Product;
}

export interface Shipment {
  id?: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  shipment_date: string;
  rma_ticket?: string;
  created_at?: string;
  customer?: Customer;
  product?: Product;
}

export interface InboundTransaction {
  id?: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  inbound_date: string;
  remarks?: string;
  customer?: Customer;
  product?: Product;
}
