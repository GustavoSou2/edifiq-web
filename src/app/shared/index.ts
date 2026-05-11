/**
 * Edifiq — Shared Module Barrel
 */

/* ── Components ─────────────────────────────────────────────*/
export { ButtonComponent }      from './components/button/button.component';
export { InputComponent }       from './components/input/input.component';
export { PageHeaderComponent }  from './components/page-header/page-header.component';
export { StatCardComponent }    from './components/stat-card/stat-card.component';
export { StatusBadgeComponent } from './components/status-badge/status-badge.component';
export { MapComponent }         from './components/map/map.component';
export { SearchSelectComponent } from './components/search-select/search-select.component';
export type { SearchSelectOption } from './components/search-select/search-select.component';
export { ToastContainerComponent } from './components/toast/toast-container.component';
export { ToastItemComponent }      from './components/toast/toast-item.component';
export { ToastService }            from './services/toast.service';
export type { Toast, ToastType, ToastOptions } from './components/toast/toast.types';

/* ── Factories ──────────────────────────────────────────────*/
export { createButtonConfig } from './factories/button.factory';
export { createInputConfig }  from './factories/input.factory';

/* ── Types ──────────────────────────────────────────────────*/
export type { ButtonConfig } from './factories/button.factory';
export type { InputConfig }  from './factories/input.factory';
export type { MapMarker, MapMarkerColor, MapTileStyle, MapConfig } from './components/map/map.types';

export type {
  ButtonVariant, ButtonSize, ButtonType,
  InputVariant,  InputSize,  InputType,
} from './types/ui.types';

export type {
  TenantId, UserId, OrderId, SupplierId, ProposalId, DeliveryId, RoleId,
  OrderStatus, ProposalStatus, ProposalItemAvailability,
  OrderDistributionStatus, OrderSelectionStatus,
  DeliveryStatus, SupplierStatus, TenantStatus,
  Plan, Tenant, User, Role, UserRole, Category,
  Supplier, OrderItem, OrderSummary, Order,
  ProposalItem, Proposal, OrderSelection,
  Delivery, Rating, Webhook, WebhookDelivery,
  AuditLog, OrderDistribution,
  ApiResponse, PaginatedResponse, PaginationParams,
  OrderFilters, SupplierFilters,
  ProposalWithSupplier, OrderItemWithDetails, ProposalItemWithDetails,
} from './types/domain.types';
