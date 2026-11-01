import { useEffect, useState } from 'react';
import { Search, ShoppingCart, UserRound } from 'lucide-react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useLogoutMutation, useSessionQuery } from '@/features/auth/queries';
import { AuthModalOverlay } from '@/features/auth/components/auth-modal-overlay';

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

function RealtimeBridge({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let disconnect: () => void = () => undefined;
    void import('@/realtime/use-marketplace-realtime').then(({ connectMarketplaceRealtime }) => {
      if (active) disconnect = connectMarketplaceRealtime(userId, queryClient);
      else disconnect();
    });
    return () => {
      active = false;
      disconnect();
    };
  }, [queryClient, userId]);
  return null;
}

export function RootLayout() {
  const sessionQuery = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent<{ mode: 'login' | 'register' }>).detail?.mode ?? 'login';
      setAuthModal(mode);
    };
    window.addEventListener('kurio:open-auth', handler);
    return () => window.removeEventListener('kurio:open-auth', handler);
  }, []);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isHomeRoute = pathname === '/';
  const isCheckoutRoute = pathname === '/checkout';
  const isCartRoute = pathname === '/cart';
  const isDetailRoute = pathname.startsWith('/nft/');
  const mainClassName = [
    isAuthRoute && 'auth-route-main',
    isCartRoute && 'cart-route-main',
    isDetailRoute && 'detail-route-main',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {sessionQuery.data ? <RealtimeBridge userId={sessionQuery.data.user.id} /> : null}
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <header
        className={`site-header${isAuthRoute ? ' auth-route-header' : ''}${isHomeRoute ? ' home-route-header' : ''}${isHomeRoute && sessionQuery.data ? ' home-route-authenticated' : ''}${isCheckoutRoute ? ' checkout-route-header' : ''}${isCartRoute ? ' cart-route-header' : ''}${isDetailRoute ? ' detail-route-header' : ''}`}
      >
        <Link to="/" search={homeSearch} className="wordmark">
          KURIO
        </Link>
        <nav aria-label="Navegação principal">
          <Link to="/" search={homeSearch} activeProps={{ className: 'is-active' }} activeOptions={{ exact: true }}>
            Início
          </Link>
          <a href={isHomeRoute ? '#catalogo' : '/#catalogo'}>Mercado</a>
          <a href={isHomeRoute ? '#lancamentos' : '/#lancamentos'}>Criadores</a>
          <a href={isHomeRoute ? '#diario' : '/#diario'}>Aprenda</a>
        </nav>
        <div className="header-tools">
          <a
            href={isHomeRoute ? '#catalogo' : '/#catalogo'}
            className="header-search-link"
            aria-label="Buscar no marketplace"
          >
            <Search size={15} aria-hidden="true" />
          </a>
          <Link to="/cart" className="header-icon-link" aria-label="Carrinho">
            <ShoppingCart size={16} aria-hidden="true" />
          </Link>
          {sessionQuery.data ? (
            <Link to="/account/profile" className="header-icon-link" aria-label="Meu perfil">
              <UserRound size={16} aria-hidden="true" />
            </Link>
          ) : null}
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
              <button
                type="button"
                className="login-link"
                onClick={() => setAuthModal('login')}
              >
                Entrar
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main id="main-content" className={mainClassName || undefined}>
        <Outlet />
      </main>
      {authModal && (
        <AuthModalOverlay
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitchMode={setAuthModal}
        />
      )}
    </>
  );
}
