/**
 * Edifiq — Domain Types
 * Tipos de domínio baseados no schema V1__schema.sql.
 * Usados em toda a aplicação para tipagem consistente.
 */

/* ── IDs ────────────────────────────────────────────────────*/
export type TenantId  = string;
export type UserId    = string;
export type OrderId   = string;
export type SupplierId = string;
export type ProposalId = string;
export type DeliveryId = string;

/* ── Enums de Status ────────────────────────────────────────*/
export type OrderStatus =
  | 'draft'
  | 'open'
  | 'in_auction'
  | 'selected'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

export type ProposalStatus =
  | 'pending'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

export type DeliveryStatus =
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned';

export type SupplierStatus = 'active' | 'inactive' | 'blocked';

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export type PlanName = 'free' | 'starter' | 'pro' | 'enterprise';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook';

/* ── Entidades ──────────────────────────────────────────────*/
export interface Plan {
  id:                   string;
  name:                 PlanName;
  price_monthly:        number;
  max_users:            number;
  max_suppliers:        number;
  max_orders_per_month: number;
  has_analytics:        boolean;
  has_api_access:       boolean;
}

export interface Tenant {
  id:            TenantId;
  name:          string;
  slug:          string;
  cnpj?:         string;
  status:        TenantStatus;
  plan_id:       string;
  plan?:         Plan;
  settings:      Record<string, unknown>;
  trial_ends_at: string | null;
  created_at:    string;
}

export interface User {
  id:               UserId;
  tenant_id:        TenantId;
  name:             string;
  email:            string;
  is_active:        boolean;
  email_verified:   boolean;
  last_login_at:    string | null;
  avatar_url?:      string;
  phone?:           string;
  created_at:       string;
  roles?:           Role[];
}

export interface Role {
  id:          string;
  tenant_id:   TenantId;
  name:        string;
  permissions: string[];
  is_system:   boolean;
}

export interface Category {
  id:        string;
  name:      string;
  slug:      string;
  parent_id: string | null;
  children?: Category[];
}

export interface Supplier {
  id:               SupplierId;
  tenant_id:        TenantId;
  name:             string;
  cnpj?:            string;
  email:            string;
  phone?:           string;
  city:             string;
  state:            string;
  lat:              number;
  lng:              number;
  reputation_score: number;
  total_ratings:    number;
  total_deliveries: number;
  response_sla_min: number;
  max_delivery_km:  number;
  status:           SupplierStatus;
  categories?:      Category[];
  created_at:       string;
}

export interface OrderItem {
  id:          string;
  order_id:    OrderId;
  category_id: string;
  category?:   Category;
  description: string;
  quantity:    number;
  unit:        string;
  sort_order:  number;
}

export interface Order {
  id:                   OrderId;
  tenant_id:            TenantId;
  reference_code:       string;
  status:               OrderStatus;
  is_urgent:            boolean;
  delivery_address:     string;
  delivery_city:        string;
  delivery_state:       string;
  delivery_lat:         number;
  delivery_lng:         number;
  auction_duration_min: number;
  max_suppliers:        number;
  expires_at:           string | null;
  metadata:             Record<string, unknown>;
  created_by:           UserId;
  created_at:           string;
  items?:               OrderItem[];
  proposals?:           Proposal[];
  proposal_count?:      number;
}

export interface ProposalItem {
  id:            string;
  proposal_id:   ProposalId;
  order_item_id: string;
  order_item?:   OrderItem;
  unit_price:    number;
  quantity:      number;
  available:     boolean;
}

export interface Proposal {
  id:           ProposalId;
  order_id:     OrderId;
  supplier_id:  SupplierId;
  supplier?:    Supplier;
  status:       ProposalStatus;
  total_price:  number;
  delivery_min: number;
  expires_at:   string | null;
  submitted_at: string | null;
  created_at:   string;
  items?:       ProposalItem[];
}

export interface OrderSelection {
  id:          string;
  order_id:    OrderId;
  proposal_id: ProposalId;
  proposal?:   Proposal;
  selected_by: UserId;
  reason:      string;
  created_at:  string;
}

export interface Delivery {
  id:             DeliveryId;
  order_id:       OrderId;
  supplier_id:    SupplierId;
  supplier?:      Supplier;
  status:         DeliveryStatus;
  tracking_code:  string | null;
  scheduled_at:   string | null;
  dispatched_at:  string | null;
  delivered_at:   string | null;
  proof_url:      string | null;
  created_at:     string;
}

export interface Rating {
  id:                  string;
  order_selection_id:  string;
  supplier_id:         SupplierId;
  supplier?:           Supplier;
  rated_by:            UserId;
  score:               1 | 2 | 3 | 4 | 5;
  comment:             string | null;
  response:            string | null;
  created_at:          string;
}

export interface Webhook {
  id:        string;
  tenant_id: TenantId;
  url:       string;
  events:    string[];
  secret:    string;
  is_active: boolean;
  created_at: string;
}

/* ── Paginação ──────────────────────────────────────────────*/
export interface PaginatedResponse<T> {
  data:        T[];
  total:       number;
  page:        number;
  per_page:    number;
  total_pages: number;
}

export interface PaginationParams {
  page?:     number;
  per_page?: number;
  sort?:     string;
  order?:    'asc' | 'desc';
}

/* ── Filtros comuns ─────────────────────────────────────────*/
export interface OrderFilters extends PaginationParams {
  status?:    OrderStatus;
  is_urgent?: boolean;
  search?:    string;
  from?:      string;
  to?:        string;
}

export interface SupplierFilters extends PaginationParams {
  status?:      SupplierStatus;
  category_id?: string;
  search?:      string;
  city?:        string;
}
