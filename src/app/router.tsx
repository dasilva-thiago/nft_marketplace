import { createRootRouteWithContext, createRoute, createRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { RootLayout } from './root-layout';
import { LoginPage, RegisterPage } from '@/features/auth/routes/auth-page';
import { HomePage } from '@/features/catalog/routes/home-page';
import { ProtectedPlaceholderPage } from '@/shared/ui/protected-placeholder-page';
import { PlaceholderPage } from '@/shared/ui/placeholder-page';

interface RouterContext { queryClient: QueryClient }
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <PlaceholderPage title="Página não encontrada" />,
});
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    page: typeof search.page === 'number' && Number.isInteger(search.page) && search.page > 0 ? search.page : 1,
    search: typeof search.search === 'string' ? search.search : '',
    collection: typeof search.collection === 'string' ? search.collection : '',
    sort: search.sort === 'name' ? 'name' as const : 'priceEth' as const,
    sortOrder: search.sortOrder === 'desc' ? 'desc' as const : 'asc' as const,
  }),
  component: HomePage,
});
const nftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nft/$nftId', component: () => <PlaceholderPage title="Detalhe do NFT" /> });
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: () => <ProtectedPlaceholderPage title="Carrinho de NFTs" /> });
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: () => <ProtectedPlaceholderPage title="Pagamento" /> });
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/$orderId', component: () => <ProtectedPlaceholderPage title="Confirmação do pedido" /> });
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({ returnTo: typeof search.returnTo === 'string' ? search.returnTo : '/' }),
  component: LoginPage,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search: Record<string, unknown>) => ({ returnTo: typeof search.returnTo === 'string' ? search.returnTo : '/' }),
  component: RegisterPage,
});
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account/profile', component: () => <ProtectedPlaceholderPage title="Perfil do colecionador" /> });
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account/wallets', component: () => <ProtectedPlaceholderPage title="Carteiras" /> });
const routeTree = rootRoute.addChildren([homeRoute, nftRoute, cartRoute, checkoutRoute, orderRoute, loginRoute, registerRoute, profileRoute, walletsRoute]);
export const router = createRouter({ routeTree, context: { queryClient: undefined! }, defaultPreload: 'intent' });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
