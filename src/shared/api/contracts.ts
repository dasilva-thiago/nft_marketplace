export interface ApiError { code: string; message: string; fields?: Record<string, string>; requestId?: string }
export interface PageRequest { page: number; pageSize: number; search?: string; sort?: string; filters?: Record<string, string | string[]> }
export interface PageResponse<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number }
export interface NftSummary { id: string; name: string; imageUrl: string; priceEth: string; availableEditions: number; network: string; version: number }
export interface Nft extends NftSummary { collection: string; description: string; edition: number; totalEditions: number; attributes: string[] }
export interface Quote { subtotalEth: string; discountEth: string; networkFeeEth: string; totalEth: string; quoteId: string; expiresAt: string; version: number }
export type OrderStatus = 'pending' | 'confirmed' | 'rejected';
export interface OrderSnapshot { id: string; status: OrderStatus; items: Array<{ nftId: string; name: string; imageUrl: string; unitPriceEth: string; quantity: number; lineTotalEth: string }>; quote: Quote; transactionRef: string; createdAt: string; version: number }
export interface VersionedEvent<T> { eventId: string; resourceId: string; version: number; occurredAt: string; payload: T }
