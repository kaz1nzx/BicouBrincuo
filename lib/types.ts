export type Unit =
  | "un"
  | "m"
  | "cm"
  | "mm"
  | "kg"
  | "g"
  | "L"
  | "mL"
  | "barra"
  | "pacote"
  | "chapa";
export type Kind = "material" | "part" | "product";
export interface Inventory {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minimum: number;
  unit: Unit;
  cost: number;
  notes: string;
}
export interface Material extends Inventory {
  supplierId: string;
  lastPrice: number;
  lastPurchase: string;
}
export interface Part extends Inventory {
  materialId: string;
  length: number;
  width: number;
  height: number;
  diameter: number;
}
export interface Ingredient {
  kind: "material" | "part";
  itemId: string;
  quantity: number;
}
export interface Product extends Inventory {
  description: string;
  species: string;
  size: string;
  image: string;
  price: number;
  active: boolean;
  online: boolean;
  labor: number;
  overhead: number;
  extra: number;
  recipe: Ingredient[];
}
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  company: string;
}
export interface Purchase {
  id: string;
  materialId: string;
  supplierId: string;
  quantity: number;
  total: number;
  freight: number;
  extra: number;
  date: string;
  invoice: string;
  notes: string;
  unitCost: number;
}
export interface Loss {
  id: string;
  kind: "material" | "part" | "product";
  itemId: string;
  quantity: number;
  cost: number;
  reason: string;
  date: string;
  responsible: string;
  notes: string;
  transformationId?: string;
  percentage?: number;
}
export interface Transformation {
  id: string;
  materialId: string;
  used: number;
  lost: number;
  outputs: { partId: string; quantity: number; unitCost: number }[];
  totalCost: number;
  date: string;
  responsible: string;
  notes: string;
}
export interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  name: string;
}
export type OrderStatus =
  | "Novo"
  | "Aguardando produção"
  | "Em produção"
  | "Pronto"
  | "Enviado"
  | "Entregue"
  | "Cancelado";
export interface Order {
  id: string;
  number: number;
  customerId: string;
  items: OrderLine[];
  date: string;
  deadline: string;
  discount: number;
  freight: number;
  total: number;
  payment: string;
  status: OrderStatus;
  notes: string;
  source: "painel" | "loja";
  sold: boolean;
}
export interface Production {
  id: string;
  productId: string;
  quantity: number;
  date: string;
  deadline: string;
  responsible: string;
  priority: string;
  status: "Planejada" | "Em andamento" | "Pausada" | "Concluída" | "Cancelada";
  cost: number;
  orderId: string;
  notes: string;
}
export interface Movement {
  id: string;
  kind: Kind;
  itemId: string;
  name: string;
  quantity: number;
  unit: Unit;
  unitCost: number;
  balance: number;
  reason: string;
  originId: string;
  date: string;
  responsible: string;
}
export interface Sale {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  date: string;
  customerId: string;
  payment: string;
}
export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
}
export interface Settings {
  name: string;
  subtitle: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  lossRate: number;
  taxRate: number;
  feeRate: number;
  commissionRate: number;
  defaultFreight: number;
}
export interface Audit {
  id: string;
  action: string;
  date: string;
  actor: string;
}
export interface State {
  materials: Material[];
  parts: Part[];
  products: Product[];
  customers: Contact[];
  suppliers: Contact[];
  purchases: Purchase[];
  losses: Loss[];
  transformations: Transformation[];
  orders: Order[];
  productions: Production[];
  movements: Movement[];
  sales: Sale[];
  expenses: Expense[];
  settings: Settings;
  audit: Audit[];
}
export type Entity =
  "materials" | "parts" | "products" | "customers" | "suppliers" | "expenses";
export interface Requirement {
  kind: "material" | "part";
  itemId: string;
  name: string;
  unit: Unit;
  required: number;
  available: number;
  missing: number;
  action: "Disponível" | "Produzir" | "Comprar";
}
export interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  species: string;
  size: string;
  image: string;
  price: number;
  stock: number;
  category: string;
}
export interface Catalog {
  products: CatalogProduct[];
  settings: Pick<
    Settings,
    | "name"
    | "subtitle"
    | "phone"
    | "email"
    | "address"
    | "logo"
    | "defaultFreight"
  >;
}
