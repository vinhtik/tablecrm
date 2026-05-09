export type ID = string | number;

export type ApiEntity = {
  id?: ID;
  uuid?: ID;
  guid?: ID;
  name?: string;
  title?: string;
  label?: string;
  phone?: string;
  price?: number;
  sale_price?: number;
  retail_price?: number;
  [key: string]: unknown;
};

export type Client = ApiEntity & {
  phone?: string;
};

export type Organization = ApiEntity;

export type Warehouse = ApiEntity;

export type Paybox = ApiEntity;

export type PriceType = ApiEntity;

export type Product = ApiEntity & {
  price?: number;
  sale_price?: number;
  retail_price?: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

export type SaleMode = "create" | "conduct";

export type Dictionaries = {
  organizations: Organization[];
  warehouses: Warehouse[];
  payboxes: Paybox[];
  priceTypes: PriceType[];
  products: Product[];
};