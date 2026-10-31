import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useLogoutMutation, useSessionQuery } from '@/features/auth/queries';

const homeSearch = { page: 1, search: '', collection: '', sort: 'priceEth' as const, sortOrder: 'asc' as const };

export function RootLayout() {
  const sessionQuery = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  return (
    <>
      <header className={`site-header${isAuthRoute ? ' auth-route-header' : ''}`}>
        <Link to="/" search={homeSearch} className="wordmark">KURIO</Link>
        <nav aria-label="Navegação principal">
          <Link to="/" search={homeSearch}>Início</Link>
          <Link to="/" search={homeSearch}>Mercado</Link>
          <Link to="/account/profile">Perfil</Link>
          <Link to="/cart">Carrinho</Link>
        </nav>
        <div className="session-header-actions" aria-live="polite">
          {sessionQuery.isPending ? <span className="session-status">Verificando sessão…</span> : null}
          {sessionQuery.data ? (
            <>
              <span className="session-user" title={sessionQuery.data.user.email}>{sessionQuery.data.user.name}</span>
              <button type="button" className="session-logout" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? 'Saindo…' : 'Sair'}
              </button>
            </>
          ) : !sessionQuery.isPending ? <Link to="/login" search={{ returnTo: '/' }} className="login-link">Entrar</Link> : null}
        </div>
      </header>
      <main className={isAuthRoute ? 'auth-route-main' : undefined}><Outlet /></main>
    </>
  );
}
