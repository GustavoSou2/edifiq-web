/**
 * Edifiq — Domain Types
 * Baseado nos response records dos controllers do edifiq-api.
 * Reflete exatamente o que a API retorna via JSON.
 */

/* ── IDs ────────────────────────────────────────────────────*/
export type TenantId   = string;
export type UserId     = string;
export type OrderId    = string;
export type SupplierId = string;
export type ProposalId = string;
export type DeliveryId = string;
export type RoleId     = string;

/* ── Enums ──────────────────────────────────────────────────*/

/** Order.Status */
export type OrderStatus =
  | 'draft'
  | 'open'
  | 'in_auction'
  | 'selected'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

/** Proposal.Status */
export type ProposalStatus =
  | 'submitted'
  | 'updated'
  | 'withdrawn';

/** ProposalItem.Availability */
export type ProposalItemAvailability =
  | 'in_stock'
  | 'backorder'
  | 'unavailable';

/** OrderDistribution.Status */
export type OrderDistributionStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'delivered'
  | 'expired'
  | 'declined';

/** OrderSelection.Status */
export type OrderSelectionStatus = 'selected' | 'cancelled';

/** Delivery.Status */
export type DeliveryStatus =
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned';

/** Supplier.Status */
export type SupplierStatus = 'active' | 'inactive' | 'blocked';

/** Tenant.Status */
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
}

/* ── tenants ────────────────────────────────────────────────*/
/** TenantController.TenantResponse */
export interface Tenant {
  id:          TenantId;
  slug:        string;
  status:      string;
  trialEndsAt: string | null;
}

/* ── users ──────────────────────────────────────────────────*/
/** UserController.UserResponse */
export interface User {
  id:            UserId;
  email:         string;
  /** full_name no banco */
  fullName:      string;
  phone:         string | null;
  /** Retornado como "active" pelo backend */
  active:        boolean;
  emailVerified: boolean;
  lastLoginAt:   string | null;
  createdAt:     string;
}

/* ── roles ──────────────────────────────────────────────────*/
/** RoleController.RoleResponse */
export interface Role {
  id:          RoleId;
  name:        string;
  permissions: string[];
  /** Retornado como "system" pelo backend */
  system:      boolean;
}

/* ── user_roles ─────────────────────────────────────────────*/
/** UserRoleController.UserRoleResponse */
export interface UserRole {
  id:        string;
  /** ID do usuário associado */
  userId:    string;
  /** ID da role associada */
  roleId:    string;
  /** ID do usuário que concedeu a role (nullable) */
  grantedBy: string | null;
  grantedAt: string;
}

/* ── categories ─────────────────────────────────────────────*/
export interface Category {
  id:       string;
  parentId: string | null;
  name:     string;
  slug:     string;
  children?: Category[];
}

/* ── suppliers ──────────────────────────────────────────────*/
/** SupplierController.SupplierResponse */
export interface Supplier {
  id:              SupplierId;
  name:            string;
  email:           string | null;
  phone:           string | null;
  address:         string | null;
  city:            string | null;
  state:           string | null;
  postalCode:      string | null;
  /** Retornado como "active" pelo backend */
  active:          boolean;
  reputationScore: number;
}

/* ── order_items ────────────────────────────────────────────*/
/** OrderController.OrderItemResponse */
export interface OrderItem {
  id:          string;
  categoryId:  string | null;
  description: string;
  unit:        string | null;
  quantity:    number;
  notes:       string | null;
  sortOrder:   number;
}

/* ── orders ─────────────────────────────────────────────────*/
/** OrderController.OrderSummaryResponse */
export interface OrderSummary {
  id:            OrderId;
  title:         string | null;
  referenceCode: string | null;
  status:        OrderStatus;
  isUrgent:      boolean;
  deliveryCity:  string | null;
  deliveryState: string | null;
  createdAt:     string;
}

/** OrderController.OrderDetailsResponse */
export interface Order {
  id:                  OrderId;
  title:               string | null;
  referenceCode:       string | null;
  notes:               string | null;
  status:              OrderStatus;
  isUrgent:            boolean;
  deliveryAddress:     string;
  deliveryCity:        string | null;
  deliveryState:       string | null;
  deliveryLat:         number | null;
  deliveryLng:         number | null;
  deliveryWindowStart: string | null;
  deliveryWindowEnd:   string | null;
  maxSuppliers:        number;
  auctionDurationMin:  number;
  createdAt:           string;
  items:               OrderItem[];
}

/* ── order_distributions ────────────────────────────────────*/
/** OrderController.OrderDistributionResponse */
export interface OrderDistribution {
  id:               string;
  orderId:          OrderId;
  supplierId:       SupplierId;
  status:           OrderDistributionStatus;
  distributedAt:    string;
  queueMessageId:   string | null;
  queuedAt:         string | null;
  processingAt:     string | null;
  sentAt:           string | null;
  failedAt:         string | null;
  dispatchAttempts: number | null;
  failureReason:    string | null;
}

/* ── proposals ──────────────────────────────────────────────*/
/** OrderController.ProposalResponse / ProposalController.ProposalResponse */
export interface Proposal {
  id:                 ProposalId;
  distributionId:     string;
  status:             ProposalStatus;
  totalPrice:         number;
  deliveryEtaHours:   number | null;
  proposedDeliveryAt: string | null;
  message:            string | null;
}

/* ── proposal_items ─────────────────────────────────────────*/
/** OrderController.ProposalItemResponse */
export interface ProposalItem {
  id:           string;
  orderItemId:  string;
  unitPrice:    number;
  totalPrice:   number;
  availability: ProposalItemAvailability;
}

/* ── order_selections ───────────────────────────────────────*/
/** OrderController.OrderSelectionResponse */
export interface OrderSelection {
  id:         string;
  orderId:    OrderId;
  proposalId: ProposalId;
  selectedBy: UserId;
  status:     OrderSelectionStatus;
  selectedAt: string;
}

/* ── deliveries ─────────────────────────────────────────────*/
/** OrderController.DeliveryResponse / DeliveryController.DeliveryResponse */
export interface Delivery {
  id:           DeliveryId;
  /** Presente em OrderController.DeliveryResponse */
  selectionId?: string;
  status:       DeliveryStatus;
  trackingCode: string | null;
  scheduledAt:  string | null;
  dispatchedAt: string | null;
  deliveredAt:  string | null;
  proofUrl:     string | null;
}

/* ── ratings ────────────────────────────────────────────────*/
/** OrderController.RatingResponse */
export interface Rating {
  id:          string;
  selectionId: string;
  supplierId:  SupplierId;
  score:       number;
  comment:     string | null;
  response:    string | null;
}

/* ── webhooks ───────────────────────────────────────────────*/
/** WebhookController.WebhookResponse */
export interface Webhook {
  id:     string;
  url:    string;
  events: string[];
  /** Retornado como "active" pelo backend */
  active: boolean;
}

/* ── webhook_deliveries ─────────────────────────────────────*/
export interface WebhookDelivery {
  id:          string;
  webhookId:   string;
  event:       string;
  payload:     Record<string, unknown>;
  statusCode:  number | null;
  response:    string | null;
  deliveredAt: string | null;
  createdAt:   string;
}

/* ── audit_logs ─────────────────────────────────────────────*/
/** AuditLogController.AuditLogResponse */
export interface AuditLog {
  id:        string;
  action:    string;
  entity:    string;
  entityId:  string | null;
  payload:   Record<string, unknown>;
  createdAt: string;
}

/* ── API Response ───────────────────────────────────────────*/
/** Envelope padrão do backend: ApiResponse<T> */
export interface ApiResponse<T> {
  data:  T;
  meta:  { total: number } | null;
  links: Record<string, unknown>;
}

/* ── Paginação ──────────────────────────────────────────────*/
/** Usado pelos services do frontend */
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

/* ── Extended types (para uso no frontend) ──────────────────*/

/** Proposal com dados expandidos do supplier (usado em dashboards) */
export interface ProposalWithSupplier extends Proposal {
  supplier?: Supplier;
  orderId?:  OrderId;
  submittedAt?: string;
}

/** OrderItem com dados expandidos (usado em comparações) */
export interface OrderItemWithDetails extends OrderItem {
  category?: Category;
}

/** ProposalItem com dados expandidos (usado em detalhes) */
export interface ProposalItemWithDetails extends ProposalItem {
  orderItem?: OrderItem;
}
