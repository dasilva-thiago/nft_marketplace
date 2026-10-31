import { Search } from 'lucide-react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useLogoutMutation, useSessionQuery } from '@/features/auth/queries';

const homeSearch = {
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

export function RootLayout() {
  const sessionQuery = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isHomeRoute = pathname === '/';

  return (
    <>
      <header
        className={`site-header${isAuthRoute ? ' auth-route-header' : ''}${isHomeRoute ? ' home-route-header' : ''}${isHomeRoute && sessionQuery.data ? ' home-route-authenticated' : ''}`}
      >
        <Link to="/" search={homeSearch} className="wordmark">
          KURIO
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/" search={homeSearch}>
            Início
          </Link>
          {isHomeRoute ? (
            <>
              <a href="#catalogo">Mercado</a>
              <a href="#lancamentos">Criadores</a>
              <a href="#diario">Aprenda</a>
            </>
          ) : (
            <>
              <Link to="/" search={homeSearch}>
                Mercado
              </Link>
              <Link to="/account/profile">Perfil</Link>
              <Link to="/cart">Carrinho</Link>
            </>
          )}
        </nav>
        {isHomeRoute && (
          <a href="#catalogo" className="header-search-link" aria-label="Buscar no marketplace">
            <Search size={15} aria-hidden="true" />
          </a>
        )}
        <div className="session-header-actions" aria-live="polite">
          {sessionQuery.isPending ? (
            <span className="session-status">Verificando sessão…</span>
          ) : null}
          {sessionQuery.data ? (
            <>
              <span className="session-user" title={sessionQuery.data.user.email}>
                {sessionQuery.data.user.name}
              </span>
              <button
                type="button"
                className="session-logout"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? 'Saindo…' : 'Sair'}
              </button>
            </>
          ) : !sessionQuery.isPending ? (
            <Link to="/login" search={{ returnTo: '/' }} className="login-link">
              Entrar
            </Link>
          ) : null}
        </div>
      </header>
      <main className={isAuthRoute ? 'auth-route-main' : undefined}>
        <Outlet />
      </main>
    </>
  );
}
