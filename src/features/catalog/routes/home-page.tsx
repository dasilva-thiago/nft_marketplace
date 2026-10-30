import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowDown, ArrowLeft, ArrowRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { catalogListQuery } from '@/features/catalog/queries';
import type { PageRequest } from '@/shared/api/contracts';

const PAGE_SIZE = 6;
const collections = ['Todas', 'Neo Apes', 'Pixel Friends', 'Neon Legends', 'Mythic Worlds'];

function formatEth(price: string) {
  return `${price} ETH`;
}

export function HomePage() {
  const searchState = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const [searchDraft, setSearchDraft] = useState(searchState.search);

  useEffect(() => setSearchDraft(searchState.search), [searchState.search]);

  const request = useMemo<PageRequest>(() => ({
    page: searchState.page,
    pageSize: PAGE_SIZE,
    search: searchState.search || undefined,
    sort: searchState.sort,
    sortOrder: searchState.sortOrder,
    filters: searchState.collection ? { collection: searchState.collection } : undefined,
  }), [searchState]);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery(catalogListQuery(request));
  const featuredQuery = useQuery(catalogListQuery({ page: 1, pageSize: 1, sort: 'priceEth', sortOrder: 'desc' }));
  const featured = featuredQuery.data?.items[0];
  const currentCollection = searchState.collection || 'Todas';

  function updateSearch(values: Partial<typeof searchState>) {
    void navigate({
      search: (previous) => ({ ...previous, ...values }),
      resetScroll: false,
    });
  }

  function onSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearch({ search: searchDraft.trim(), page: 1 });
  }

  return (
    <div className="marketplace-page">
      <section className="market-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> COLECIONÁVEIS DIGITAIS</p>
          <h1 id="hero-title">SEJA DONO DO FUTURO DA ARTE DIGITAL</h1>
          <p className="hero-description">Descubra peças digitais únicas, criadas para colecionadores que enxergam o próximo capítulo da arte.</p>
          <a className="primary-button" href="#catalogo">Explorar coleção <ArrowRight size={16} aria-hidden="true" /></a>
          <div className="hero-proof"><span className="proof-dot" /> Arte selecionada <span className="proof-divider">/</span> Coleções independentes</div>
        </div>
        <div className="hero-art-wrap">
          <div className="hero-art-frame">
            <img src={featured?.imageUrl ?? '/placeholders/nft-placeholder.svg'} alt={featured ? `Arte de ${featured.name}` : 'Arte digital em destaque'} className="hero-art" />
            <div className="hero-art-overlay"><span>EM DESTAQUE</span><strong>{featured?.name ?? 'Peças digitais únicas'}</strong>{featured && <span>{formatEth(featured.priceEth)}</span>}</div>
          </div>
          <div className="hero-index" aria-hidden="true">01 <span /> 04</div>
        </div>
      </section>

      <section className="catalog-section" id="catalogo" aria-labelledby="catalog-heading">
        <div className="catalog-heading-row">
          <div><p className="eyebrow">EXPLORE O MARKETPLACE</p><h2 id="catalog-heading">Peças em destaque</h2></div>
          <form className="catalog-search" onSubmit={onSubmitSearch} role="search">
            <label className="sr-only" htmlFor="catalog-search-input">Buscar NFTs</label>
            <Search size={17} aria-hidden="true" />
            <input id="catalog-search-input" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Buscar arte, coleção..." />
            <button type="submit">Buscar</button>
          </form>
        </div>

        <div className="catalog-layout">
          <aside className="catalog-sidebar" aria-label="Filtros do catálogo">
            <div className="filter-title"><SlidersHorizontal size={15} aria-hidden="true" /><span>Filtros</span></div>
            <fieldset className="filter-group">
              <legend>Coleção</legend>
              {collections.map((collection) => {
                const selected = currentCollection === collection;
                return <button key={collection} type="button" className={`filter-option${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => updateSearch({ collection: collection === 'Todas' ? '' : collection, page: 1 })}><span>{collection}</span><span className="filter-radio" aria-hidden="true" /></button>;
              })}
            </fieldset>
            <label className="sort-label" htmlFor="sort-select">Ordenar por</label>
            <div className="select-wrap"><select id="sort-select" value={`${searchState.sort}:${searchState.sortOrder}`} onChange={(event) => {
              const [sort, sortOrder] = event.target.value.split(':') as [typeof searchState.sort, typeof searchState.sortOrder];
              updateSearch({ sort, sortOrder, page: 1 });
            }}><option value="priceEth:asc">Menor preço</option><option value="priceEth:desc">Maior preço</option><option value="name:asc">Nome A–Z</option><option value="name:desc">Nome Z–A</option></select><ArrowDown size={14} aria-hidden="true" /></div>
            <button type="button" className="clear-filters" onClick={() => { setSearchDraft(''); void navigate({ search: { page: 1, search: '', collection: '', sort: 'priceEth', sortOrder: 'asc' } }); }}>Limpar filtros</button>
          </aside>

          <div className="catalog-results" aria-live="polite" aria-busy={isPending || isFetching}>
            <div className="results-toolbar"><span>{data ? `${data.totalItems} peças encontradas` : 'Carregando peças'}</span><span className="results-sort-note">Preço em ETH</span></div>
            {isPending && <div className="nft-grid" aria-label="Carregando catálogo">{Array.from({ length: PAGE_SIZE }, (_, index) => <div className="nft-card-skeleton" key={index}><div /><span /><span /></div>)}</div>}
            {isError && <div className="catalog-message" role="alert"><strong>Não foi possível carregar o catálogo.</strong><span>{error instanceof Error ? error.message : 'Verifique a conexão e tente novamente.'}</span><button type="button" className="secondary-button" onClick={() => void refetch()}>Tentar novamente</button></div>}
            {!isPending && !isError && data?.items.length === 0 && <div className="catalog-message"><strong>Nenhuma peça encontrada</strong><span>Tente outra busca ou remova alguns filtros.</span><button type="button" className="secondary-button" onClick={() => { setSearchDraft(''); void navigate({ search: { page: 1, search: '', collection: '', sort: 'priceEth', sortOrder: 'asc' } }); }}>Ver todas as peças</button></div>}
            {!isPending && !isError && data && data.items.length > 0 && <div className="nft-grid">
              {data.items.map((nft) => <article className="nft-card" key={nft.id}>
                <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="nft-card-link" aria-label={`Ver ${nft.name}`}>
                  <div className="nft-card-image-wrap"><img src={nft.imageUrl} alt={`Arte de ${nft.name}`} loading="lazy" /><span className="edition-badge">{nft.availableEditions > 0 ? `${nft.availableEditions} disponíveis` : 'Esgotado'}</span></div>
                  <div className="nft-card-details"><div><span className="nft-collection">{nft.collection}</span><h3>{nft.name}</h3></div><div className="nft-card-price"><span>Preço</span><strong>{formatEth(nft.priceEth)}</strong></div></div>
                  <div className="nft-card-footer"><span>{nft.network}</span><span className="view-item">Ver peça <ArrowRight size={13} aria-hidden="true" /></span></div>
                </Link>
              </article>)}
            </div>}
            {data && data.totalPages > 1 && <nav className="pagination" aria-label="Paginação do catálogo"><button type="button" disabled={searchState.page <= 1} onClick={() => updateSearch({ page: searchState.page - 1 })} aria-label="Página anterior"><ArrowLeft size={16} /></button><span>Página <strong>{searchState.page}</strong> de <strong>{data.totalPages}</strong></span><button type="button" disabled={searchState.page >= data.totalPages} onClick={() => updateSearch({ page: searchState.page + 1 })} aria-label="Próxima página"><ArrowRight size={16} /></button></nav>}
          </div>
        </div>
      </section>
    </div>
  );
}
