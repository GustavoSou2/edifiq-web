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
  TenantId, UserId, OrderId, SupplierId, ProposalId, DeliveryId,
  OrderStatus, ProposalStatus, DeliveryStatus, SupplierStatus,
  TenantStatus, PlanName, NotificationChannel,
  Plan, Tenant, User, Role, Category,
  Supplier, OrderItem, Order,
  ProposalItem, Proposal, OrderSelection,
  Delivery, Rating, Webhook,
  PaginatedResponse, PaginationParams,
  OrderFilters, SupplierFilters,
} from './types/domain.types';
