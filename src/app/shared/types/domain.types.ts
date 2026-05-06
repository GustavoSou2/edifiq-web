/**
 * Edifiq — Domain Types
 * Baseado no schema real do banco (DDL) com campos em camelCase
 * conforme serialização padrão do backend Java.
 */

/* ── IDs ────────────────────────────────────────────────────*/
export type TenantId   = string;
export type UserId     = string;
export type OrderId    = string;
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

/* ── plans ──────────────────────────────────────────────────*/
export interface Plan {
  id:                string;
  name:              string;
  maxUsers:          number;
  maxSuppliers:      number;
  maxOrdersPerMonth: number;
  hasAnalytics:      boolean;
  hasApiAccess:      boolean;
  priceMonthly:      number;
  createdAt:         string;
}

/* ── tenants ────────────────────────────────────────────────*/
export interface Tenant {
  id:          TenantId;
  planId:      string;
  plan?:       Plan;
  slug:        string;
  name:        string;
  cnpj:        string | null;
  status:      TenantStatus;
  settings:    Record<string, unknown>;
  trialEndsAt: string | null;
  createdAt:   string;
  updatedAt:   string;
}

/* ── users ──────────────────────────────────────────────────*/
export interface User {
  id:            UserId;
  tenantId:      TenantId;
  email:         string;
  /** full_name no banco → fullName no Java */
  fullName:      string;
  phone:         string | null;
  avatarUrl:     string | null;
  isActive:      boolean;
  emailVerified: boolean;
  lastLoginAt:   string | null;
  createdAt:     string;
  updatedAt:     string;
  roles?:        Role[];
}

/* ── roles ──────────────────────────────────────────────────*/
export interface Role {
  id:          string;
  tenantId:    TenantId;
  name:        string;
  description: string | null;
  permissions: string[];
  isSystem:    boolean;
  createdAt:   string;
}

/* ── categories ─────────────────────────────────────────────*/
export interface Category {
  id:        string;
  parentId:  string | null;
  name:      string;
  slug:      string;
  createdAt: string;
  children?: Category[];
}

/* ── suppliers ──────────────────────────────────────────────*/
export interface Supplier {
  id:              SupplierId;
  tenantId:        TenantId;
  /** company_name no banco → companyName no Java */
  companyName:     string;
  cnpj:            string;
  email:           string;
  phone:           string | null;
  status:          SupplierStatus;
  address:         string | null;
  city:            string | null;
  state:           string | null;
  zipCode:         string | null;
  lat:             number | null;
  lng:             number | null;
  reputationScore: number;
  totalRatings:    number;
  totalDeliveries: number;
  maxDeliveryKm:   number;
  responseSlaMin:  number;
  createdAt:       string;
  updatedAt:       string;
  categories?:     Category[];
}

/* ── order_items ────────────────────────────────────────────*/
export interface OrderItem {
  id:          string;
  orderId:     OrderId;
  categoryId:  string | null;
  category?:   Category;
  description: string;
  quantity:    number;
  unit:        string;
  notes:       string | null;
  sortOrder:   number;
}

/* ── orders ─────────────────────────────────────────────────*/
export interface Order {
  id:                OrderId;
  tenantId:          TenantId;
  createdBy:         UserId;
  status:            OrderStatus;
  isUrgent:          boolean;
  deliveryAddress:   string;
  deliveryCity:      string | null;
  deliveryState:     string | null;
  deliveryLat:       number | null;
  deliveryLng:       number | null;
  maxSuppliers:      number;
  auctionDurationMin: number;
  expiresAt:         string | null;
  publishedAt:       string | null;
  createdAt:         string;
  updatedAt:         string;
  notes:             string | null;
  referenceCode:     string | null;
  metadata:          Record<string, unknown>;
  items?:            OrderItem[];
  proposals?:        Proposal[];
  proposalCount?:    number;
}

/* ── proposals ──────────────────────────────────────────────*/
export interface Proposal {
  id:          ProposalId;
  orderId:     OrderId;
  supplierId:  SupplierId;
  supplier?:   Supplier;
  status:      ProposalStatus;
  totalPrice:  number;
  deliveryMin: number;
  notes:       string | null;
  submittedAt: string;
  expiresAt:   string | null;
  updatedAt:   string;
  items?:      ProposalItem[];
}

/* ── proposal_items ─────────────────────────────────────────*/
export interface ProposalItem {
  id:          string;
  proposalId:  ProposalId;
  orderItemId: string;
  orderItem?:  OrderItem;
  unitPrice:   number;
  quantity:    number;
  available:   boolean;
  notes:       string | null;
}

/* ── order_selections ───────────────────────────────────────*/
export interface OrderSelection {
  id:         string;
  orderId:    OrderId;
  proposalId: ProposalId;
  proposal?:  Proposal;
  selectedBy: UserId;
  selectedAt: string;
  reason:     string | null;
}

/* ── deliveries ─────────────────────────────────────────────*/
export interface Delivery {
  id:                DeliveryId;
  /** Ligada a order_selection, não diretamente ao order/supplier */
  orderSelectionId:  string;
  orderSelection?:   OrderSelection;
  status:            DeliveryStatus;
  trackingCode:      string | null;
  scheduledAt:       string | null;
  dispatchedAt:      string | null;
  deliveredAt:       string | null;
  deliveryNotes:     string | null;
  proofUrl:          string | null;
  createdAt:         string;
  updatedAt:         string;
}

/* ── ratings ────────────────────────────────────────────────*/
export interface Rating {
  id:               string;
  orderSelectionId: string;
  ratedBy:          UserId;
  supplierId:       SupplierId;
  supplier?:        Supplier;
  score:            1 | 2 | 3 | 4 | 5;
  comment:          string | null;
  response:         string | null;
  createdAt:        string;
}

/* ── webhooks ───────────────────────────────────────────────*/
export interface Webhook {
  id:        string;
  tenantId:  TenantId;
  url:       string;
  events:    string[];
  secret:    string;
  isActive:  boolean;
  createdAt: string;
}

/* ── audit_logs ─────────────────────────────────────────────*/
export interface AuditLog {
  id:        string;
  tenantId:  TenantId;
  userId:    UserId | null;
  action:    string;
  entity:    string;
  entityId:  string | null;
  payload:   Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/* ── order_distributions ────────────────────────────────────*/
export interface OrderDistribution {
  id:               string;
  orderId:          OrderId;
  supplierId:       SupplierId;
  supplier?:        Supplier;
  notifiedAt:       string;
  channel:          string;
  openedAt:         string | null;
  queueMessageId:   string | null;
  queuedAt:         string | null;
  processingAt:     string | null;
  sentAt:           string | null;
  failedAt:         string | null;
  dispatchAttempts: number;
  failureReason:    string | null;
}

/* ── Paginação ──────────────────────────────────────────────*/
export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  perPage:    number;
  totalPages: number;
}

export interface PaginationParams {
  page?:    number;
  perPage?: number;
  sort?:    string;
  order?:   'asc' | 'desc';
}

/* ── Filtros comuns ─────────────────────────────────────────*/
export interface OrderFilters extends PaginationParams {
  status?:   OrderStatus;
  isUrgent?: boolean;
  search?:   string;
  from?:     string;
  to?:       string;
}

export interface SupplierFilters extends PaginationParams {
  status?:     SupplierStatus;
  categoryId?: string;
  search?:     string;
  city?:       string;
}
