/**
 * Edifiq — API Services Barrel
 *
 * Importe os serviços de domínio a partir daqui.
 *
 * @example
 * import { OrdersApiService } from '@core/api';
 */

export { OrdersApiService }     from './orders-api.service';
export { ProposalsApiService }  from './proposals-api.service';
export { SuppliersApiService }  from './suppliers-api.service';
export { DeliveriesApiService } from './deliveries-api.service';
export { UsersApiService }      from './users-api.service';
export { TenantApiService }     from './tenant-api.service';
export { CategoriesApiService } from './categories-api.service';

export type { CreateOrderPayload, SelectProposalPayload as OrderSelectProposalPayload, CreateRatingPayload } from './orders-api.service';
export type { SubmitProposalPayload, ReceivedDistribution }                from './proposals-api.service';
export type { CreateSupplierPayload, UpdateSupplierPayload }               from './suppliers-api.service';
export type { UpdateDeliveryStatusPayload, DeliveryDetail }                from './deliveries-api.service';
export type { InviteUserPayload, CreateRolePayload }       from './users-api.service';
export type { UpdateTenantPayload, CreateWebhookPayload }  from './tenant-api.service';
