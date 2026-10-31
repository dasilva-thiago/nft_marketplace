import Big from 'big.js';
import { delay, http, HttpResponse } from 'msw';
import type {
  ApiError,
  Cart,
  NftSummary,
  PageRequest,
  Quote,
  QuoteRequest,
} from '@/shared/contracts';
import {
  AddCartItemRequestSchema,
  LoginRequestSchema,
  PageRequestSchema,
  QuoteRequestSchema,
  RegisterRequestSchema,
  UpdateCartItemRequestSchema,
} from '@/shared/contracts/schemas';
import {
  deleteSessionFromRequest,
  getSessionFromRequest,
  getUserByEmail,
  loginMockUser,
  registerMockUser,
  resetMockAuthState,
} from './auth-state';
import { nftFixtures } from './fixtures/nfts';
import {
  MockScenarioSchema,
  getMockScenario,
  resetMockScenario,
  setMockScenario,
} from './scenarios/scenario-state';
import { socketIoMockHandler } from './socket-io-handler';
import { appEnv } from '@/app/config/env';
import { getCartForUser, resetMockCartState, saveCartForUser } from './db/cart-state';

const configuredDelay = appEnv.mockDelayMs;

function apiError(
  code: ApiError['code'],
  message: string,
  retryable = false,
  fields?: Record<string, string>,
): ApiError {
  return {
    code,
    message,
    requestId: `mock-${Date.now()}`,
    retryable,
    ...(fields ? { fields } : {}),
  };
}

function validationFields(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): Record<string, string> {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0] ?? 'form'), issue.message]),
  );
}

function unauthorizedResponse() {
  return HttpResponse.json(
    apiError('SESSION_INVALID', 'Sua sessão expirou ou não foi encontrada.'),
    {
      status: 401,
    },
  );
}

function notFoundResponse(message: string) {
  return HttpResponse.json(apiError('NOT_FOUND', message), { status: 404 });
}

function availabilityResponse(nftName: string) {
  return HttpResponse.json(
    apiError('AVAILABILITY_CONFLICT', `A disponibilidade de ${nftName} mudou.`, false),
    { status: 409 },
  );
}

function validationResponse(
  message: string,
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
) {
  return HttpResponse.json(apiError('VALIDATION_ERROR', message, false, validationFields(error)), {
    status: 400,
  });
}

function toNftSummary(nft: (typeof nftFixtures)[number]): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    imageUrl: nft.imageUrl,
    collection: nft.collection,
    priceEth: nft.priceEth,
    availableEditions: nft.availableEditions,
    network: nft.network,
    version: nft.version,
  };
}

function getCartResponse(userId: string): Cart {
  const cart = getCartForUser(userId);
  return {
    ...cart,
    items: cart.items.map((item) => {
      const nft = nftFixtures.find((candidate) => candidate.id === item.nftId);
      return nft ? { ...item, nft: toNftSummary(nft) } : item;
    }),
  };
}

function buildQuote(
  items: QuoteRequest['items'],
  couponCode?: string,
): { value: Quote } | { error: Response } {
  const quoteLines = [];
  let subtotal = new Big(0);
  for (const requested of items) {
    const nft = nftFixtures.find((candidate) => candidate.id === requested.nftId);
    if (!nft) return { error: notFoundResponse('NFT não encontrado.') };
    if (requested.quantity > nft.availableEditions)
      return { error: availabilityResponse(nft.name) };
    const lineTotal = new Big(nft.priceEth).times(requested.quantity);
    subtotal = subtotal.plus(lineTotal);
    quoteLines.push({
      nftId: nft.id,
      name: nft.name,
      imageUrl: nft.imageUrl,
      unitPriceEth: nft.priceEth,
      quantity: requested.quantity,
      lineTotalEth: lineTotal.toFixed(),
    });
  }

  const normalizedCoupon = couponCode?.trim().toUpperCase();
  if (normalizedCoupon === 'EXPIRED')
    return {
      error: HttpResponse.json(apiError('COUPON_EXPIRED', 'Este cupom expirou.'), { status: 422 }),
    };
  if (normalizedCoupon && normalizedCoupon !== 'KURIO10')
    return {
      error: HttpResponse.json(apiError('COUPON_INVALID', 'Cupom inválido.'), { status: 422 }),
    };

  const discount = normalizedCoupon === 'KURIO10' ? subtotal.times('0.1') : new Big(0);
  const networkFee = new Big('0.016');
  const now = new Date();
  const quote: Quote = {
    quoteId: `quote-${Date.now()}`,
    items: quoteLines,
    couponCode: normalizedCoupon ?? null,
    subtotalEth: subtotal.toFixed(),
    discountEth: discount.toFixed(),
    networkFeeEth: networkFee.toFixed(),
    totalEth: subtotal.minus(discount).plus(networkFee).toFixed(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60_000).toISOString(),
    version: 1,
  };
  return { value: quote };
}

async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

function readPageRequest(url: URL): PageRequest | ApiError {
  const filters: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const match = /^filters\[([^\]]+)\](?:\[\])?$/.exec(key);
    if (!match) continue;
    const filterName = match[1];
    const existing = filters[filterName];
    if (existing === undefined) filters[filterName] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else filters[filterName] = [existing, value];
  }

  const parsed = PageRequestSchema.safeParse({
    page: Number(url.searchParams.get('page') ?? 1),
    pageSize: Number(url.searchParams.get('pageSize') ?? 12),
    search: url.searchParams.get('search') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    sortOrder: url.searchParams.get('sortOrder') ?? undefined,
    filters: Object.keys(filters).length ? filters : undefined,
  });
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Os parâmetros da busca ou paginação são inválidos.');
  return parsed.data;
}

function filterValues(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map((item) => item.toLowerCase());
}

function matchesFilters(
  nft: NftSummary & { attributes?: Array<{ trait: string; value: string }> },
  filters: PageRequest['filters'],
): boolean {
  if (!filters) return true;
  const collections = filterValues(filters.collection);
  const networks = filterValues(filters.network);
  const traits = filterValues(filters.trait);
  const minimumPrice =
    filters.priceMin && !Array.isArray(filters.priceMin) ? filters.priceMin : undefined;
  const maximumPrice =
    filters.priceMax && !Array.isArray(filters.priceMax) ? filters.priceMax : undefined;
  if (collections.length && !collections.includes(nft.collection.toLowerCase())) return false;
  if (networks.length && !networks.includes(nft.network.toLowerCase())) return false;
  if (minimumPrice && new Big(nft.priceEth).lt(minimumPrice)) return false;
  if (maximumPrice && new Big(nft.priceEth).gt(maximumPrice)) return false;
  if (traits.length) {
    const values = (nft.attributes ?? [])
      .flatMap(({ trait, value }) => [trait, value])
      .map((value) => value.toLowerCase());
    if (!traits.some((trait) => values.includes(trait))) return false;
  }
  return true;
}

async function waitForScenario(search?: string) {
  const scenario = getMockScenario();
  if (scenario === 'slow') await delay(Math.max(700, configuredDelay));
  else if (scenario === 'out-of-order')
    await delay(search?.toLowerCase().includes('slow') ? 1_200 : 20);
  else if (configuredDelay > 0) await delay(Math.min(configuredDelay, 10_000));
}

function scenarioError() {
  const scenario = getMockScenario();
  if (scenario === 'rate-limited') {
    return HttpResponse.json(
      apiError(
        'RATE_LIMITED',
        'Muitas consultas em sequência. Aguarde antes de tentar novamente.',
        true,
      ),
      {
        status: 429,
        headers: { 'Retry-After': '2' },
      },
    );
  }
  if (scenario === 'unavailable') {
    return HttpResponse.json(
      apiError('TRANSIENT_ERROR', 'Catálogo temporariamente indisponível.', true),
      { status: 503 },
    );
  }
  return null;
}

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ ok: true, scenario: getMockScenario() })),
  // Rotas abaixo são somente controle do servidor de demonstração/testes; não são API de produção.
  http.put('/api/__mock/scenario', async ({ request }) => {
    const body = await request.json().catch(() => null);
    const parsed =
      body && typeof body === 'object' && 'scenario' in body
        ? MockScenarioSchema.safeParse(body.scenario)
        : { success: false as const };
    if (!parsed.success) {
      return HttpResponse.json(apiError('VALIDATION_ERROR', 'Cenário de mock desconhecido.'), {
        status: 400,
      });
    }
    setMockScenario(parsed.data);
    return HttpResponse.json({ scenario: getMockScenario() });
  }),
  http.post('/api/__mock/reset', () => {
    resetMockScenario();
    resetMockAuthState();
    resetMockCartState();
    return HttpResponse.json({ scenario: getMockScenario(), reset: true });
  }),
  http.post('/api/auth/register', async ({ request }) => {
    const parsed = RegisterRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return HttpResponse.json(
        apiError(
          'VALIDATION_ERROR',
          'Confira os campos do cadastro.',
          false,
          validationFields(parsed.error),
        ),
        { status: 400 },
      );
    }
    if (getUserByEmail(parsed.data.email)) {
      return HttpResponse.json(
        apiError('CONFLICT', 'Já existe uma conta com este e-mail.', false, {
          email: 'Este e-mail já está cadastrado.',
        }),
        { status: 409 },
      );
    }
    const created = await registerMockUser(parsed.data);
    return HttpResponse.json(created.session, {
      status: 201,
      headers: { 'X-Mock-Session': created.sessionId },
    });
  }),
  http.post('/api/auth/login', async ({ request }) => {
    const parsed = LoginRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return HttpResponse.json(
        apiError(
          'VALIDATION_ERROR',
          'Confira os campos de acesso.',
          false,
          validationFields(parsed.error),
        ),
        { status: 400 },
      );
    }
    const authenticated = await loginMockUser(parsed.data);
    if (!authenticated) {
      return HttpResponse.json(apiError('SESSION_INVALID', 'E-mail ou senha inválidos.'), {
        status: 401,
      });
    }
    return HttpResponse.json(authenticated.session, {
      headers: { 'X-Mock-Session': authenticated.sessionId },
    });
  }),
  http.get('/api/session', ({ request }) => {
    const currentSession = getSessionFromRequest(request);
    if (!currentSession)
      return HttpResponse.json(
        apiError('SESSION_INVALID', 'Sua sessão expirou ou não foi encontrada.'),
        { status: 401 },
      );
    return HttpResponse.json(currentSession.session);
  }),
  http.post('/api/auth/logout', ({ request }) => {
    deleteSessionFromRequest(request);
    return HttpResponse.json({ loggedOut: true });
  }),
  http.get('/api/cart', ({ request }) => {
    const currentSession = getSessionFromRequest(request);
    if (!currentSession) return unauthorizedResponse();
    return HttpResponse.json(getCartResponse(currentSession.session.user.id));
  }),
  http.post('/api/cart/items', async ({ request }) => {
    const currentSession = getSessionFromRequest(request);
    if (!currentSession) return unauthorizedResponse();
    const parsed = AddCartItemRequestSchema.safeParse(await readJson(request));
    if (!parsed.success)
      return validationResponse('Informe uma quantidade inteira válida.', parsed.error);

    const nft = nftFixtures.find((item) => item.id === parsed.data.nftId);
    if (!nft) return notFoundResponse('NFT não encontrado.');
    const cart = getCartForUser(currentSession.session.user.id);
    const existing = cart.items.find((item) => item.nftId === nft.id);
    const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity;
    if (nextQuantity > nft.availableEditions) return availabilityResponse(nft.name);
    const items = existing
      ? cart.items.map((item) =>
          item.nftId === nft.id
            ? { ...item, quantity: nextQuantity, nft: toNftSummary(nft) }
            : item,
        )
      : [...cart.items, { nftId: nft.id, quantity: parsed.data.quantity, nft: toNftSummary(nft) }];
    return HttpResponse.json(saveCartForUser({ ...cart, items, version: cart.version + 1 }));
  }),
  http.patch('/api/cart/items/:nftId', async ({ request, params }) => {
    const currentSession = getSessionFromRequest(request);
    if (!currentSession) return unauthorizedResponse();
    const parsed = UpdateCartItemRequestSchema.safeParse(await readJson(request));
    if (!parsed.success)
      return validationResponse('Informe uma quantidade inteira válida.', parsed.error);
    const cart = getCartForUser(currentSession.session.user.id);
    const line = cart.items.find((item) => item.nftId === params.nftId);
    if (!line) return notFoundResponse('O item não está no carrinho.');
    const nft = nftFixtures.find((item) => item.id === params.nftId);
    if (!nft) return notFoundResponse('NFT não encontrado.');
    if (parsed.data.quantity > nft.availableEditions) return availabilityResponse(nft.name);
    const items = cart.items.map((item) =>
      item.nftId === params.nftId
        ? { ...item, quantity: parsed.data.quantity, nft: toNftSummary(nft) }
        : item,
    );
    return HttpResponse.json(saveCartForUser({ ...cart, items, version: cart.version + 1 }));
  }),
  http.delete('/api/cart/items/:nftId', ({ request, params }) => {
    const currentSession = getSessionFromRequest(request);
    if (!currentSession) return unauthorizedResponse();
    const cart = getCartForUser(currentSession.session.user.id);
    const items = cart.items.filter((item) => item.nftId !== params.nftId);
    return HttpResponse.json(saveCartForUser({ ...cart, items, version: cart.version + 1 }));
  }),
  http.post('/api/quotes', async ({ request }) => {
    const currentSession = getSessionFromRequest(request);
    if (!currentSession) return unauthorizedResponse();
    const parsed = QuoteRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationResponse('Confira os itens da cotação.', parsed.error);
    const quote = buildQuote(parsed.data.items, parsed.data.couponCode);
    if ('error' in quote) return quote.error;
    return HttpResponse.json(quote.value);
  }),
  http.get('/api/nfts', async ({ request }) => {
    const params = readPageRequest(new URL(request.url));
    if ('code' in params) return HttpResponse.json(params, { status: 400 });

    const forcedError = scenarioError();
    if (forcedError) return forcedError;
    await waitForScenario(params.search);

    let items = getMockScenario() === 'empty' ? [] : [...nftFixtures];
    if (params.search) {
      const term = params.search.trim().toLowerCase();
      items = items.filter((nft) =>
        [nft.name, nft.collection, nft.description].some((value) =>
          value.toLowerCase().includes(term),
        ),
      );
    }
    items = items.filter((nft) => matchesFilters(nft, params.filters));

    if (params.sort) {
      const direction = params.sortOrder === 'desc' ? -1 : 1;
      items.sort((left, right) => {
        if (params.sort === 'priceEth')
          return new Big(left.priceEth).cmp(right.priceEth) * direction;
        const leftValue = params.sort === 'collection' ? left.collection : left.name;
        const rightValue = params.sort === 'collection' ? right.collection : right.name;
        return leftValue.localeCompare(rightValue) * direction;
      });
    }

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / params.pageSize);
    const start = (params.page - 1) * params.pageSize;
    const pageItems = items.slice(start, start + params.pageSize).map((nft) => ({
      id: nft.id,
      name: nft.name,
      imageUrl: nft.imageUrl,
      collection: nft.collection,
      priceEth: nft.priceEth,
      availableEditions: nft.availableEditions,
      network: nft.network,
      version: nft.version,
    }));

    return HttpResponse.json({
      items: pageItems,
      page: params.page,
      pageSize: params.pageSize,
      totalItems,
      totalPages,
    });
  }),
  http.get('/api/nfts/:nftId', async ({ params }) => {
    const forcedError = scenarioError();
    if (forcedError) return forcedError;
    await waitForScenario();
    const nft = nftFixtures.find((item) => item.id === params.nftId);
    if (!nft)
      return HttpResponse.json(apiError('NOT_FOUND', 'NFT não encontrado.'), { status: 404 });
    return HttpResponse.json(nft);
  }),
  socketIoMockHandler,
];
