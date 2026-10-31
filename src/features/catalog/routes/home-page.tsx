import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Heart,
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { catalogListQuery } from '@/features/catalog/queries';
import { useSessionQuery } from '@/features/auth/queries';
import { useFavoritesQuery, useToggleFavoriteMutation } from '@/features/favorites/queries';
import type { NftSummary, PageRequest } from '@/shared/contracts';
import { MarketingFooter } from '@/shared/ui/marketing-footer';
import { NftCardSkeleton } from '@/shared/ui/skeleton';

const PAGE_SIZE = 9;
const defaultHomeSearch = {
  page: 1,
  search: '',
  collection: '',
  network: '',
  trait: '',
  priceMin: '',
  priceMax: '',
  sort: 'priceEth' as const,
  sortOrder: 'asc' as const,
};

function formatEth(price: string) {
  return `${price} ETH`;
}
function uniqueValues(items: NftSummary[], key: 'collection' | 'network') {
  return Array.from(new Set(items.map((item) => item[key]))).sort((left, right) =>
    left.localeCompare(right),
  );
}
function EditorialNftCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="visual-nft-card" aria-label={nft.name}>
      <div className="visual-nft-image">
        <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} loading="lazy" />
      </div>
      <div className="visual-nft-meta">
        <div>
          <span>{nft.collection}</span>
          <h3>{nft.name}</h3>
        </div>
        <strong>{formatEth(nft.priceEth)}</strong>
      </div>
    </article>
  );
}

function LimitedFeaturedCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="limited-featured-card">
      <p className="limited-featured-kicker">NFT EM DESTAQUE</p>
      <strong>OFERTA LIMITADA</strong>
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} aria-label={`Ver oferta ${nft.name}`}>
        <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} />
      </Link>
      <div className="limited-featured-meta">
        <span>{nft.name}</span>
        <strong>{formatEth(nft.priceEth)}</strong>
      </div>
    </article>
  );
}

function EditorialFeatureCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="editorial-feature-card">
      <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} loading="lazy" />
      <div>
        <span>{nft.collection}</span>
        <h3>{nft.name}</h3>
        <p>
          Uma peça selecionada para colecionadores que acompanham a próxima geração da arte digital.
        </p>
        <Link to="/nft/$nftId" params={{ nftId: nft.id }}>
          Explorar <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function HomePage() {
  const searchState = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const sessionQuery = useSessionQuery();
  const favoritesQuery = useFavoritesQuery();
  const favoriteMutation = useToggleFavoriteMutation();
  const [searchDraft, setSearchDraft] = useState(searchState.search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const favoriteIds = useMemo(
    () => new Set(favoritesQuery.data?.map((favorite) => favorite.nftId)),
    [favoritesQuery.data],
  );
  const priceDraftRef = useRef({
    min: searchState.priceMin || '0',
    max: searchState.priceMax || '5',
  });

  useEffect(() => setSearchDraft(searchState.search), [searchState.search]);
  useEffect(() => {
    priceDraftRef.current = { min: searchState.priceMin || '0', max: searchState.priceMax || '5' };
  }, [searchState.priceMin, searchState.priceMax]);

  async function toggleFavorite(nftId: string) {
    if (!sessionQuery.data) {
      await navigate({ to: '/login', search: { returnTo: '/' } });
      return;
    }
    await favoriteMutation.mutateAsync({
      nftId,
      shouldFavorite: !favoriteIds.has(nftId),
    });
  }

  const filters = useMemo<Record<string, string | string[]> | undefined>(() => {
    const next: Record<string, string> = {};
    if (searchState.collection) next.collection = searchState.collection;
    if (searchState.network) next.network = searchState.network;
    if (searchState.trait) next.trait = searchState.trait;
    if (searchState.priceMin) next.priceMin = searchState.priceMin;
    if (searchState.priceMax) next.priceMax = searchState.priceMax;
    return Object.keys(next).length ? next : undefined;
  }, [
    searchState.collection,
    searchState.network,
    searchState.trait,
    searchState.priceMin,
    searchState.priceMax,
  ]);

  const request = useMemo<PageRequest>(
    () => ({
      page: searchState.page,
      pageSize: PAGE_SIZE,
      search: searchState.search || undefined,
      sort: searchState.sort,
      sortOrder: searchState.sortOrder,
      filters,
    }),
    [filters, searchState.page, searchState.search, searchState.sort, searchState.sortOrder],
  );

  const { data, isPending, isError, error, refetch, isFetching } = useQuery(
    catalogListQuery(request),
  );
  const facetsQuery = useQuery(
    catalogListQuery({ page: 1, pageSize: 100, sort: 'name', sortOrder: 'asc' }),
  );
  const heroQuery = useQuery(
    catalogListQuery({ page: 1, pageSize: 1, search: 'emerald', sort: 'name', sortOrder: 'asc' }),
  );
  const featuredQuery = useQuery(
    catalogListQuery({ page: 1, pageSize: 1, search: 'desert', sort: 'name', sortOrder: 'asc' }),
  );
  const launchQuery = useQuery(
    catalogListQuery({
      page: 1,
      pageSize: 4,
      sort: 'priceEth',
      sortOrder: 'desc',
      filters: { collection: 'Neo Apes' },
    }),
  );
  const diaryQuery = useQuery(
    catalogListQuery({
      page: 1,
      pageSize: 4,
      sort: 'name',
      sortOrder: 'asc',
      filters: { collection: 'Neo Apes' },
    }),
  );
  const heroFeatured = heroQuery.data?.items[0];
  const featured = featuredQuery.data?.items[0];
  const facetItems = facetsQuery.data?.items ?? [];
  const collections = uniqueValues(facetItems, 'collection');
  const networks = uniqueValues(facetItems, 'network');
  const currentCollection = searchState.collection || 'Todas';

  function updateSearch(values: Partial<typeof searchState>) {
    void navigate({ search: (previous) => ({ ...previous, ...values }), resetScroll: false });
  }
  function onSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch({ search: searchDraft.trim(), page: 1 });
  }
  function clearFilters() {
    setSearchDraft('');
    void navigate({ search: defaultHomeSearch });
  }
  function toggleNetwork(network: string) {
    updateSearch({ network: searchState.network === network ? '' : network, page: 1 });
  }
  function onPriceChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDraft = {
      ...priceDraftRef.current,
      [event.currentTarget.id === 'price-min' ? 'min' : 'max']: event.currentTarget.value,
    };
    priceDraftRef.current = nextDraft;
    updateSearch({
      priceMin: nextDraft.min === '0' ? '' : nextDraft.min,
      priceMax: nextDraft.max === '5' ? '' : nextDraft.max,
      page: 1,
    });
  }

  return (
    <>
      <div className="marketplace-page home-reference">
        <div className="mobile-discovery-bar">
          <form className="mobile-search-form" onSubmit={onSubmitSearch} role="search">
            <Search size={17} aria-hidden="true" />
            <label className="sr-only" htmlFor="mobile-catalog-search">
              Buscar NFTs
            </label>
            <input
              id="mobile-catalog-search"
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Explorar coleções"
            />
            <button type="submit" className="mobile-search-submit">
              <span className="sr-only">Buscar</span>
              <Search size={14} aria-hidden="true" />
            </button>
          </form>
          <button
            type="button"
            className="mobile-filter-trigger"
            aria-label="Abrir filtros"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            aria-expanded={mobileFiltersOpen}
            aria-controls="catalog-filters"
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
        <section className="market-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={14} aria-hidden="true" /> BEM-VINDO À KURIO
            </p>
            <h1 id="hero-title">SEJA DONO DO FUTURO DA ARTE DIGITAL</h1>
            <p className="hero-description">
              Descubra peças digitais únicas, criadas para colecionadores que enxergam o próximo
              capítulo da arte.
            </p>
            <a className="primary-button" href="#catalogo">
              Explorar coleção <ArrowRight size={16} aria-hidden="true" />
            </a>
            <div className="hero-proof">
              <span className="proof-dot" /> Arte selecionada{' '}
              <span className="proof-divider">/</span> Coleções independentes
            </div>
          </div>
          <div className="hero-art-wrap">
            <div className="hero-art-frame">
              <img
                src={heroFeatured?.imageUrl ?? '/placeholders/nft-placeholder.svg'}
                alt={heroFeatured ? `Arte de ${heroFeatured.name}` : 'Arte digital em destaque'}
                className="hero-art"
              />
              <div className="hero-art-overlay">
                <span>EM DESTAQUE</span>
                <strong>{heroFeatured?.name ?? 'Peças digitais únicas'}</strong>
                {heroFeatured && <span>{formatEth(heroFeatured.priceEth)}</span>}
              </div>
            </div>
            <div className="hero-index" aria-hidden="true">
              01 <span /> 04
            </div>
          </div>
        </section>

        <section className="catalog-section" id="catalogo" aria-labelledby="catalog-heading">
          <div className="catalog-mobile-tabs">
            <button type="button" className="is-active" onClick={() => clearFilters()}>
              Todos os NFTs
            </button>
            <button
              type="button"
              onClick={() => updateSearch({ sort: 'priceEth', sortOrder: 'desc', page: 1 })}
            >
              Novos lançamentos
            </button>
            <button
              type="button"
              onClick={() => updateSearch({ sort: 'priceEth', sortOrder: 'desc', page: 1 })}
            >
              Em alta
            </button>
          </div>
          <div className="catalog-heading-row">
            <div>
              <p className="eyebrow">EXPLORE O MARKETPLACE</p>
              <h2 id="catalog-heading">Peças em destaque</h2>
            </div>
            <form className="catalog-search" onSubmit={onSubmitSearch} role="search">
              <label className="sr-only" htmlFor="catalog-search-input">
                Buscar NFTs
              </label>
              <Search size={17} aria-hidden="true" />
              <input
                id="catalog-search-input"
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Buscar arte, coleção..."
              />
              <button type="submit">Buscar</button>
            </form>
          </div>
          <div className="catalog-layout">
            <aside
              id="catalog-filters"
              className={`catalog-sidebar${mobileFiltersOpen ? ' is-mobile-open' : ''}`}
              aria-label="Filtros do catálogo"
            >
              <div className="filter-title">
                <SlidersHorizontal size={15} aria-hidden="true" />
                <span>Filtros</span>
                <button
                  type="button"
                  className="mobile-filter-close"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Fechar filtros"
                >
                  <X size={15} />
                </button>
              </div>
              <fieldset className="filter-group">
                <legend>Coleção</legend>
                <button
                  type="button"
                  className={`filter-option${currentCollection === 'Todas' ? ' is-selected' : ''}`}
                  aria-pressed={currentCollection === 'Todas'}
                  onClick={() => updateSearch({ collection: '', page: 1 })}
                >
                  <span>Todas</span>
                  <span className="filter-count">{facetsQuery.data?.totalItems ?? '—'}</span>
                </button>
                {collections.map((collection) => (
                  <button
                    key={collection}
                    type="button"
                    className={`filter-option${currentCollection === collection ? ' is-selected' : ''}`}
                    aria-pressed={currentCollection === collection}
                    onClick={() => updateSearch({ collection, page: 1 })}
                  >
                    <span>{collection}</span>
                    <span className="filter-radio" aria-hidden="true" />
                  </button>
                ))}
              </fieldset>
              <fieldset className="filter-group">
                <legend>Rede</legend>
                {networks.map((network) => (
                  <button
                    key={network}
                    type="button"
                    className={`filter-option${searchState.network === network ? ' is-selected' : ''}`}
                    aria-pressed={searchState.network === network}
                    onClick={() => toggleNetwork(network)}
                  >
                    <span>{network}</span>
                    <span className="filter-radio" aria-hidden="true" />
                  </button>
                ))}
              </fieldset>
              <label className="trait-filter" htmlFor="trait-filter">
                Atributo
                <input
                  id="trait-filter"
                  value={searchState.trait}
                  onChange={(event) => updateSearch({ trait: event.target.value, page: 1 })}
                  placeholder="Ex.: Cream"
                />
              </label>
              <fieldset className="price-filter">
                <legend>Faixa de preço</legend>
                <div className="price-range-inputs">
                  <label htmlFor="price-min">
                    mín.
                    <input
                      id="price-min"
                      type="number"
                      min="0"
                      max="5"
                      step="0.01"
                      value={searchState.priceMin || '0'}
                      onChange={onPriceChange}
                    />
                  </label>
                  <label htmlFor="price-max">
                    máx.
                    <input
                      id="price-max"
                      type="number"
                      min="0"
                      max="5"
                      step="0.01"
                      value={searchState.priceMax || '5'}
                      onChange={onPriceChange}
                    />
                  </label>
                </div>
                <div className="price-range-values">
                  <span>{searchState.priceMin || '0.00'} ETH</span>
                  <span>{searchState.priceMax || '5.00'} ETH</span>
                </div>
              </fieldset>
              <label className="sort-label" htmlFor="sort-select">
                Ordenar por
              </label>
              <div className="select-wrap">
                <select
                  id="sort-select"
                  value={`${searchState.sort}:${searchState.sortOrder}`}
                  onChange={(event) => {
                    const [sort, sortOrder] = event.target.value.split(':') as [
                      typeof searchState.sort,
                      typeof searchState.sortOrder,
                    ];
                    updateSearch({ sort, sortOrder, page: 1 });
                  }}
                >
                  <option value="priceEth:asc">Menor preço</option>
                  <option value="priceEth:desc">Maior preço</option>
                  <option value="name:asc">Nome A–Z</option>
                  <option value="name:desc">Nome Z–A</option>
                </select>
                <ArrowDown size={14} aria-hidden="true" />
              </div>
              <button type="button" className="clear-filters" onClick={clearFilters}>
                Limpar filtros
              </button>
              {featured && <LimitedFeaturedCard nft={featured} />}
            </aside>
            <div className="catalog-results" aria-live="polite" aria-busy={isPending || isFetching}>
              <div className="results-toolbar">
                <span>{data ? `${data.totalItems} peças encontradas` : 'Carregando peças'}</span>
                <span className="results-sort-note">Preço em ETH</span>
              </div>
              {isPending && (
                <div className="nft-grid" aria-label="Carregando catálogo" aria-busy="true">
                  {Array.from({ length: PAGE_SIZE }, (_, index) => (
                    <NftCardSkeleton key={index} />
                  ))}
                </div>
              )}
              {isError && (
                <div className="catalog-message" role="alert">
                  <strong>Não foi possível carregar o catálogo.</strong>
                  <span>
                    {error instanceof Error
                      ? error.message
                      : 'Verifique a conexão e tente novamente.'}
                  </span>
                  <button type="button" className="secondary-button" onClick={() => void refetch()}>
                    Tentar novamente
                  </button>
                </div>
              )}
              {!isPending && !isError && data?.items.length === 0 && (
                <div className="catalog-message">
                  <strong>Nenhuma peça encontrada</strong>
                  <span>Tente outra busca ou remova alguns filtros.</span>
                  <button type="button" className="secondary-button" onClick={clearFilters}>
                    Ver todas as peças
                  </button>
                </div>
              )}
              {!isPending && !isError && data && data.items.length > 0 && (
                <div className="nft-grid">
                  {data.items.map((nft) => (
                    <article className="nft-card" key={nft.id}>
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: nft.id }}
                        className="nft-card-link"
                        aria-label={`Ver ${nft.name}`}
                      >
                        <div className="nft-card-image-wrap">
                          <img src={nft.imageUrl} alt={`Arte de ${nft.name}`} loading="lazy" />
                          <span className="edition-badge">
                            {nft.availableEditions > 0
                              ? `${nft.availableEditions} disponíveis`
                              : 'Esgotado'}
                          </span>
                          <button
                            type="button"
                            className="card-favorite"
                            aria-label={`${favoriteIds.has(nft.id) ? 'Remover dos favoritos' : 'Favoritar'} ${nft.name}`}
                            aria-pressed={favoriteIds.has(nft.id)}
                            disabled={favoriteMutation.isPending || favoritesQuery.isPending}
                            onClick={(event) => {
                              event.preventDefault();
                              void toggleFavorite(nft.id);
                            }}
                          >
                            <Heart
                              size={14}
                              fill={favoriteIds.has(nft.id) ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                        <div className="nft-card-details">
                          <div>
                            <span className="nft-collection">{nft.collection}</span>
                            <h3>{nft.name}</h3>
                          </div>
                          <div className="nft-card-price">
                            <span>Preço</span>
                            <strong>{formatEth(nft.priceEth)}</strong>
                          </div>
                        </div>
                        <div className="nft-card-footer">
                          <span>{nft.network}</span>
                          <span className="view-item">
                            Ver peça <ArrowRight size={13} aria-hidden="true" />
                          </span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
              {data && data.totalPages > 1 && (
                <nav className="pagination" aria-label="Paginação do catálogo">
                  <button
                    type="button"
                    disabled={searchState.page <= 1}
                    onClick={() => updateSearch({ page: searchState.page - 1 })}
                    aria-label="Página anterior"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span>
                    Página <strong>{searchState.page}</strong> de <strong>{data.totalPages}</strong>
                  </span>
                  <button
                    type="button"
                    disabled={searchState.page >= data.totalPages}
                    onClick={() => updateSearch({ page: searchState.page + 1 })}
                    aria-label="Próxima página"
                  >
                    <ArrowRight size={16} />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </section>

        <section
          className="home-section launch-section"
          id="lancamentos"
          aria-labelledby="launch-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">LANÇAMENTOS SELECIONADOS</p>
              <h2 id="launch-heading">Lançamentos recentes</h2>
            </div>
            <a href="#catalogo">
              Ver coleção <ArrowRight size={14} />
            </a>
          </div>
          <div className="launch-grid">
            {launchQuery.data?.items.slice(0, 2).map((nft) => (
              <EditorialFeatureCard key={nft.id} nft={nft} />
            ))}
          </div>
        </section>
        <section className="home-section diary-section" id="diario" aria-labelledby="diary-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DIÁRIO DA CUNHAGEM</p>
              <h2 id="diary-heading">Histórias por trás da arte</h2>
            </div>
            <span className="section-note">Criadores, coleções e cultura digital</span>
          </div>
          <div className="diary-grid">
            {diaryQuery.data?.items.map((nft) => (
              <EditorialNftCard key={nft.id} nft={nft} />
            ))}
          </div>
        </section>
      </div>
      <MarketingFooter />
      <nav className="mobile-bottom-nav" aria-label="Navegação mobile">
        <Link to="/" search={defaultHomeSearch} className="is-active" aria-label="Início">
          <Sparkles size={17} />
        </Link>
        <Link to="/" search={defaultHomeSearch} aria-label="Favoritos">
          <Heart size={17} />
        </Link>
        <Link to="/" search={defaultHomeSearch} className="mobile-search" aria-label="Explorar">
          <Search size={20} />
        </Link>
        <Link to="/cart" aria-label="Carrinho">
          <ShoppingCart size={17} />
        </Link>
        {sessionQuery.data ? (
          <Link to="/account/profile" aria-label="Perfil">
            <User size={17} />
          </Link>
        ) : (
          <Link to="/login" search={{ returnTo: '/' }} aria-label="Entrar">
            <User size={17} />
          </Link>
        )}
      </nav>
    </>
  );
}
