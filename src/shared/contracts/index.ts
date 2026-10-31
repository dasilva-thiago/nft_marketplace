/**
 * Contratos compartilhados entre transporte HTTP, TanStack Query, domínio e interface.
 * Valores em ETH permanecem strings decimais; quantidades e páginas são inteiros.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'SESSION_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'AVAILABILITY_CONFLICT'
  | 'CONFLICT'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'PAYMENT_REJECTED'
  | 'RATE_LIMITED'
  | 'TRANSIENT_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
  requestId?: string;
  retryable?: boolean;
}

/** Listagens usam páginas começando em 1; filtros e ordenação também fazem parte da URL. */
export interface PageRequest {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | string[]>;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface NftAttribute {
  trait: string;
  value: string;
}

export interface NftSummary {
  id: string;
  name: string;
  imageUrl: string;
  collection: string;
  priceEth: string;
  availableEditions: number;
  network: string;
  version: number;
}

export interface Nft extends NftSummary {
  description: string;
  gallery: string[];
  edition: number;
  totalEditions: number;
  attributes: NftAttribute[];
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface Session {
  user: UserSummary;
  expiresAt: string;
}

export interface AuthResponse extends Session {}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Favorite {
  userId: string;
  nftId: string;
  createdAt: string;
}

export interface CartLine {
  nftId: string;
  quantity: number;
  nft: NftSummary;
}

export interface Cart {
  userId: string | null;
  items: CartLine[];
  version: number;
}

export interface AddCartItemRequest {
  nftId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface QuoteLine {
  nftId: string;
  name: string;
  imageUrl: string;
  unitPriceEth: string;
  quantity: number;
  lineTotalEth: string;
}

export interface QuoteRequest {
  items: Array<{ nftId: string; quantity: number }>;
  couponCode?: string;
  walletId?: string;
  network?: string;
}

export interface Quote {
  quoteId: string;
  items: QuoteLine[];
  couponCode: string | null;
  subtotalEth: string;
  discountEth: string;
  networkFeeEth: string;
  totalEth: string;
  createdAt: string;
  expiresAt: string;
  version: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected';

/** Recorte imutável dos dados usados no momento da compra; não reler preços do catálogo para o recibo. */
export interface OrderSnapshot {
  id: string;
  userId: string;
  status: OrderStatus;
  items: QuoteLine[];
  quote: Quote;
  transactionRef: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateOrderRequest {
  quoteId: string;
  walletId: string;
  network: string;
}

export interface CollectorProfile {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface UpdateProfileRequest {
  name: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Wallet {
  id: string;
  userId: string;
  label: string;
  address: string;
  network: string;
  isPrimary: boolean;
  version: number;
}

export interface CreateWalletRequest {
  label: string;
  address: string;
  network: string;
  isPrimary?: boolean;
}

export type UpdateWalletRequest = Partial<CreateWalletRequest>;

/** Envelope comum dos eventos Socket.IO simulados. */
export interface VersionedEvent<T> {
  eventId: string;
  resourceId: string;
  version: number;
  occurredAt: string;
  payload: T;
}

export interface NftUpdatedPayload {
  nftId: string;
  priceEth: string;
  availableEditions: number;
}

export interface OrderUpdatedPayload {
  orderId: string;
  status: OrderStatus;
  transactionRef: string | null;
}
