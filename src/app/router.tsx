import { createRootRouteWithContext, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { HomePage } from '@/features/catalog/routes/home-page';
import { PlaceholderPage } from '@/shared/ui/placeholder-page';

interface RouterContext { queryClient: QueryClient }
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <><header className="site-header"><Link to="/" className="wordmark">KURIO</Link><nav aria-label="Navegação principal"><Link to="/">Início</Link><Link to="/">Mercado</Link><Link to="/account/profile">Perfil</Link><Link to="/cart">Carrinho</Link></nav><Link to="/login" className="login-link">Entrar</Link></header><main><Outlet /></main></>,
  notFoundComponent: () => <PlaceholderPage title="Página não encontrada" />,
});
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const nftRoute = createRoute({ getParentRoute: () => rootRoute, path: '/nft/$nftId', component: () => <PlaceholderPage title="Detalhe do NFT" /> });
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cart', component: () => <PlaceholderPage title="Carrinho de NFTs" /> });
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/checkout', component: () => <PlaceholderPage title="Pagamento" /> });
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/orders/$orderId', component: () => <PlaceholderPage title="Confirmação do pedido" /> });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: () => <PlaceholderPage title="Login" /> });
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: () => <PlaceholderPage title="Cadastro" /> });
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account/profile', component: () => <PlaceholderPage title="Perfil do colecionador" /> });
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account/wallets', component: () => <PlaceholderPage title="Carteiras" /> });
const routeTree = rootRoute.addChildren([homeRoute, nftRoute, cartRoute, checkoutRoute, orderRoute, loginRoute, registerRoute, profileRoute, walletsRoute]);
export const router = createRouter({ routeTree, context: { queryClient: undefined! }, defaultPreload: 'intent' });
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
