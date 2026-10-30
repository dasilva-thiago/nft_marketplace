import { z } from 'zod';

const nonNegativeInteger = z.number().int().min(0);
const positiveInteger = z.number().int().min(1);
const ethDecimal = z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/, 'ETH deve ser uma string decimal positiva ou zero.');

export const ApiErrorSchema = z.object({
  code: z.enum([
    'VALIDATION_ERROR', 'SESSION_INVALID', 'FORBIDDEN', 'NOT_FOUND',
    'AVAILABILITY_CONFLICT', 'CONFLICT', 'COUPON_INVALID', 'COUPON_EXPIRED',
    'PAYMENT_REJECTED', 'RATE_LIMITED', 'TRANSIENT_ERROR',
  ]),
  message: z.string().min(1),
  fields: z.record(z.string(), z.string()).optional(),
  requestId: z.string().optional(),
  retryable: z.boolean().optional(),
});

export const NftAttributeSchema = z.object({ trait: z.string().min(1), value: z.string().min(1) });

export const NftSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  imageUrl: z.string().min(1),
  collection: z.string().min(1),
  priceEth: ethDecimal,
  availableEditions: nonNegativeInteger,
  network: z.string().min(1),
  version: nonNegativeInteger,
});

export const NftSchema = NftSummarySchema.extend({
  description: z.string(),
  gallery: z.array(z.string().min(1)).min(1),
  edition: positiveInteger,
  totalEditions: positiveInteger,
  attributes: z.array(NftAttributeSchema),
}).refine((nft) => nft.edition <= nft.totalEditions, {
  message: 'A edição atual não pode ser maior que o total de edições.',
  path: ['edition'],
});

export const PageRequestSchema = z.object({
  page: positiveInteger,
  pageSize: positiveInteger.max(100),
  search: z.string().optional(),
  sort: z.enum(['name', 'priceEth', 'collection']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  filters: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
});

export function PageResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    page: positiveInteger,
    pageSize: positiveInteger,
    totalItems: nonNegativeInteger,
    totalPages: nonNegativeInteger,
  });
}
