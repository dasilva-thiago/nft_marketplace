import Big from 'big.js';
import { delay, http, HttpResponse } from 'msw';
import type { ApiError, NftSummary, PageRequest } from '@/shared/api/contracts';
import { PageRequestSchema } from '@/shared/api/schemas';
import { nftFixtures } from './fixtures/nfts';
import { MockScenarioSchema, getMockScenario, resetMockScenario, setMockScenario } from './scenarios/scenario-state';
import { socketIoMockHandler } from './socket-io-handler';

const configuredDelay = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? '0');

function apiError(code: ApiError['code'], message: string, retryable = false): ApiError {
  return { code, message, requestId: `mock-${Date.now()}`, retryable };
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
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Os parâmetros da busca ou paginação são inválidos.');
  return parsed.data;
}

function filterValues(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map((item) => item.toLowerCase());
}

function matchesFilters(nft: NftSummary & { attributes?: Array<{ trait: string; value: string }> }, filters: PageRequest['filters']): boolean {
  if (!filters) return true;
  const collections = filterValues(filters.collection);
  const networks = filterValues(filters.network);
  const traits = filterValues(filters.trait);
  if (collections.length && !collections.includes(nft.collection.toLowerCase())) return false;
  if (networks.length && !networks.includes(nft.network.toLowerCase())) return false;
  if (traits.length) {
    const values = (nft.attributes ?? []).flatMap(({ trait, value }) => [trait, value]).map((value) => value.toLowerCase());
    if (!traits.some((trait) => values.includes(trait))) return false;
  }
  return true;
}

async function waitForScenario(search?: string) {
  const scenario = getMockScenario();
  if (scenario === 'slow') await delay(Math.max(700, configuredDelay));
  else if (scenario === 'out-of-order') await delay(search?.toLowerCase().includes('slow') ? 1_200 : 20);
  else if (configuredDelay > 0) await delay(Math.min(configuredDelay, 10_000));
}

function scenarioError() {
  const scenario = getMockScenario();
  if (scenario === 'rate-limited') {
    return HttpResponse.json(apiError('RATE_LIMITED', 'Muitas consultas em sequência. Aguarde antes de tentar novamente.', true), {
      status: 429,
      headers: { 'Retry-After': '2' },
    });
  }
  if (scenario === 'unavailable') {
    return HttpResponse.json(apiError('TRANSIENT_ERROR', 'Catálogo temporariamente indisponível.', true), { status: 503 });
  }
  return null;
}

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ ok: true, scenario: getMockScenario() })),
  // Rotas abaixo são somente controle do servidor de demonstração/testes; não são API de produção.
  http.put('/api/__mock/scenario', async ({ request }) => {
    const body = await request.json().catch(() => null);
    const parsed = body && typeof body === 'object' && 'scenario' in body
      ? MockScenarioSchema.safeParse(body.scenario)
      : { success: false as const };
    if (!parsed.success) {
      return HttpResponse.json(apiError('VALIDATION_ERROR', 'Cenário de mock desconhecido.'), { status: 400 });
    }
    setMockScenario(parsed.data);
    return HttpResponse.json({ scenario: getMockScenario() });
  }),
  http.post('/api/__mock/reset', () => {
    resetMockScenario();
    return HttpResponse.json({ scenario: getMockScenario(), reset: true });
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
        [nft.name, nft.collection, nft.description].some((value) => value.toLowerCase().includes(term)),
      );
    }
    items = items.filter((nft) => matchesFilters(nft, params.filters));

    if (params.sort) {
      const direction = params.sortOrder === 'desc' ? -1 : 1;
      items.sort((left, right) => {
        if (params.sort === 'priceEth') return new Big(left.priceEth).cmp(right.priceEth) * direction;
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

    return HttpResponse.json({ items: pageItems, page: params.page, pageSize: params.pageSize, totalItems, totalPages });
  }),
  http.get('/api/nfts/:nftId', async ({ params }) => {
    const forcedError = scenarioError();
    if (forcedError) return forcedError;
    await waitForScenario();
    const nft = nftFixtures.find((item) => item.id === params.nftId);
    if (!nft) return HttpResponse.json(apiError('NOT_FOUND', 'NFT não encontrado.'), { status: 404 });
    return HttpResponse.json(nft);
  }),
  socketIoMockHandler,
];
