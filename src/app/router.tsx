import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  parseSearchWith,
  stringifySearchWith,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { RootLayout } from './root-layout';
import { ProtectedPlaceholderPage } from '@/features/auth/components/protected-placeholder-page';
import { PlaceholderPage } from '@/shared/ui/placeholder-page';

const LoginPage = lazyRouteComponent(() => import('@/features/auth/routes/auth-page'), 'LoginPage');
const RegisterPage = lazyRouteComponent(
  () => import('@/features/auth/routes/auth-page'),
  'RegisterPage',
);
const HomePage = lazyRouteComponent(
  () => import('@/features/catalog/routes/home-page'),
  'HomePage',
);
const NftDetailPage = lazyRouteComponent(
  () => import('@/features/catalog/routes/nft-detail-page'),
  'NftDetailPage',
);
const CartPage = lazyRouteComponent(() => import('@/features/cart/routes/cart-page'), 'CartPage');
const CollectorPage = lazyRouteComponent(
  () => import('@/features/checkout/routes/collector-page'),
  'CollectorPage',
);
const CheckoutPage = lazyRouteComponent(
  () => import('@/features/checkout/routes/checkout-page'),
  'CheckoutPage',
);
const OrderPage = lazyRouteComponent(
  () => import('@/features/orders/routes/order-page'),
  'OrderPage',
);
const ProfilePage = lazyRouteComponent(
  () => import('@/features/profile/routes/profile-page'),
  'ProfilePage',
);
const WalletsPage = lazyRouteComponent(
  () => import('@/features/wallets/routes/wallets-page'),
  'WalletsPage',
);

interface RouterContext {
  queryClient: QueryClient;
}
const parseSearchValue = (value: string) => {
  if (!/^[\[{" ]/.test(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <PlaceholderPage title="Página não encontrada" />,
});
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search: Record<string, unknown>) => ({
    page:
      Number.isInteger(Number(search.page)) && Number(search.page) > 0 ? Number(search.page) : 1,
    search: typeof search.search === 'string' ? search.search : '',
    collection: typeof search.collection === 'string' ? search.collection : '',
    network: typeof search.network === 'string' ? search.network : '',
    trait: typeof search.trait === 'string' ? search.trait : '',
    priceMin: typeof search.priceMin === 'string' ? search.priceMin : '',
    priceMax: typeof search.priceMax === 'string' ? search.priceMax : '',
    sort: search.sort === 'name' ? ('name' as const) : ('priceEth' as const),
    sortOrder: search.sortOrder === 'desc' ? ('desc' as const) : ('asc' as const),
  }),
  component: HomePage,
});
const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailPage,
});
const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: () => (
    <ProtectedPlaceholderPage>
      <CartPage />
    </ProtectedPlaceholderPage>
  ),
});
const collectorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout/collector',
  component: () => (
    <ProtectedPlaceholderPage>
      <CollectorPage />
    </ProtectedPlaceholderPage>
  ),
});
const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: () => (
    <ProtectedPlaceholderPage>
      <CheckoutPage />
    </ProtectedPlaceholderPage>
  ),
});
const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId',
  component: () => (
    <ProtectedPlaceholderPage>
      <OrderPage />
    </ProtectedPlaceholderPage>
  ),
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : '/',
  }),
  component: LoginPage,
});
const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : '/',
  }),
  component: RegisterPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account/profile',
  component: () => (
    <ProtectedPlaceholderPage>
      <ProfilePage />
    </ProtectedPlaceholderPage>
  ),
});
const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account/wallets',
  component: () => (
    <ProtectedPlaceholderPage>
      <WalletsPage />
    </ProtectedPlaceholderPage>
  ),
});
const routeTree = rootRoute.addChildren([
  homeRoute,
  nftRoute,
  cartRoute,
  collectorRoute,
  checkoutRoute,
  orderRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
]);
export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
  defaultPreload: 'intent',
  parseSearch: parseSearchWith(parseSearchValue),
  stringifySearch: stringifySearchWith(JSON.stringify),
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
