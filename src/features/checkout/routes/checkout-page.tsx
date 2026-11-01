import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSessionQuery } from '@/features/auth/queries';
import { readApiError } from '@/features/auth/api/auth-api';
import { useCartQuery, useConsumeCartMutation, useQuoteQuery } from '@/features/cart/queries';
import { useCreateOrderMutation, useRecoverOrderMutation } from '@/features/orders/queries';
import {
  useConnectWalletMutation,
  useWalletsQuery,
} from '@/features/wallets/queries';
import { useNftRealtimeUpdate } from '@/realtime/realtime-signal';
import { MarketingFooter } from '@/shared/ui/marketing-footer';
import type { WalletConnectionStatus } from '@/shared/contracts';

const CHECKOUT_IDEMPOTENCY_STORAGE_KEY = 'kurio.checkout.idempotency-key';
const WALLET_PROVIDERS = ['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const;
type WalletProvider = (typeof WALLET_PROVIDERS)[number];

function WalletConnectIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="16" fill="#3396FF" />
      <path
        fill="#fff"
        d="M9.58 12.76c3.54-3.46 9.28-3.46 12.82 0l.43.42a.44.44 0 0 1 0 .63l-1.46 1.43a.23.23 0 0 1-.32 0l-.59-.57c-2.47-2.42-6.47-2.42-8.94 0l-.63.62a.23.23 0 0 1-.32 0L9.11 13.86a.44.44 0 0 1 0-.63l.47-.47Zm15.84 2.95 1.3 1.27a.44.44 0 0 1 0 .63l-5.85 5.72a.46.46 0 0 1-.64 0l-4.15-4.06a.11.11 0 0 0-.16 0l-4.15 4.06a.46.46 0 0 1-.64 0L5.28 17.6a.44.44 0 0 1 0-.63l1.3-1.27a.46.46 0 0 1 .64 0l4.15 4.06c.04.04.12.04.16 0l4.15-4.06a.46.46 0 0 1 .64 0l4.15 4.06c.04.04.12.04.16 0l4.15-4.06a.46.46 0 0 1 .64 0Z"
      />
    </svg>
  );
}

function MetaMaskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="16" fill="#1A1A1A" />
      <g transform="translate(5,4) scale(0.69)">
        <polygon fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" points="32.19,1.5 18.8,11.3 21.31,5.12" />
        <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="1.79,1.5 15.06,11.39 12.69,5.12" />
        <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="27.23,23.09 23.55,28.79 31.44,31 33.74,23.22" />
        <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="0.27,23.22 2.56,31 10.45,28.79 6.77,23.09" />
        <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="10.01,14.84 7.76,18.2 15.59,18.56 15.3,10.1" />
        <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="23.98,14.84 18.62,10 18.8,18.56 26.23,18.2" />
        <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="10.45,28.79 15.1,26.46 11.07,23.27" />
        <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="18.89,26.46 23.55,28.79 22.92,23.27" />
        <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="23.55,28.79 18.89,26.46 19.27,29.54 19.22,30.9" />
        <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="10.45,28.79 14.77,30.9 14.73,29.54 15.1,26.46" />
        <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="14.83,21.73 10.96,20.6 13.65,19.35" />
        <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="19.16,21.73 20.34,19.35 23.04,20.6" />
        <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="10.45,28.79 11.12,23.09 6.77,23.22" />
        <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="22.87,23.09 23.55,28.79 27.23,23.22" />
        <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="26.23,18.2 18.8,18.56 19.17,21.73 20.35,19.35 23.05,20.6" />
        <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="10.96,20.6 13.66,19.35 14.83,21.73 15.59,18.56 7.76,18.2" />
        <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="7.76,18.2 11.07,23.27 10.96,20.6" />
        <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="23.05,20.6 22.93,23.27 26.23,18.2" />
        <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="15.59,18.56 14.83,21.73 15.79,26.63 16,23.35" />
        <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="18.8,18.56 18,23.35 18.2,26.63 19.17,21.73" />
        <polygon fill="#FCD9AD" stroke="#FCD9AD" strokeLinecap="round" strokeLinejoin="round" points="19.17,21.73 18.2,26.63 18.89,26.46 22.93,23.27 23.05,20.6" />
        <polygon fill="#FCD9AD" stroke="#FCD9AD" strokeLinecap="round" strokeLinejoin="round" points="10.96,20.6 11.07,23.27 15.1,26.46 15.79,26.63 14.83,21.73" />
      </g>
    </svg>
  );
}

function CoinbaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <circle cx="16" cy="16" r="9.6" fill="#fff" />
      <path
        fill="#0052FF"
        d="M13.6 13.6h4.8a.4.4 0 0 1 .4.4v4a.4.4 0 0 1-.4.4h-4.8a.4.4 0 0 1-.4-.4v-4a.4.4 0 0 1 .4-.4Z"
      />
    </svg>
  );
}

function getCheckoutIdempotencyKey(): string {
  if (typeof window === 'undefined') return `checkout-${crypto.randomUUID()}`;
  const stored = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
  if (stored) return stored;
  const key = `checkout-${crypto.randomUUID()}`;
  window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY, key);
  return key;
}

function isRequestTimeout(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ECONNABORTED',
  );
}

export function CheckoutPage() {
  const navigate = useNavigate({ from: '/checkout' });
  const sessionQuery = useSessionQuery();
  const cartQuery = useCartQuery();
  const consumeCartMutation = useConsumeCartMutation();
  const createOrderMutation = useCreateOrderMutation();
  const recoverOrderMutation = useRecoverOrderMutation();
  const walletsQuery = useWalletsQuery();
  const connectWalletMutation = useConnectWalletMutation();
  const wallets = useMemo(() => walletsQuery.data ?? [], [walletsQuery.data]);
  const [network, setNetwork] = useState<'Ethereum' | 'Polygon'>('Ethereum');
  const [walletId, setWalletId] = useState('');
  const [walletProvider, setWalletProvider] = useState<WalletProvider | null>(null);
  const [walletConnection, setWalletConnection] = useState<WalletConnectionStatus>('disconnected');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [idempotencyKey] = useState(getCheckoutIdempotencyKey);
  const [timedOut, setTimedOut] = useState(false);
  const [mustReviewQuote, setMustReviewQuote] = useState(false);
  const [isMobileCheckout, setIsMobileCheckout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 520px)').matches,
  );
  const cart = cartQuery.data;
  const selectedWallet = wallets.find(
    (wallet) => wallet.id === walletId && wallet.network === network,
  );
  const compatibleWallets = wallets.filter((wallet) => wallet.network === network);
  const walletOptions = isMobileCheckout ? wallets : compatibleWallets;
  const quoteRequest = useMemo(
    () => ({
      items: cart?.items.map(({ nftId, quantity }) => ({ nftId, quantity })) ?? [],
      walletId,
      network,
    }),
    [cart?.items, network, walletId],
  );
  const quoteQuery = useQuoteQuery(quoteRequest);
  const { refetch: refetchQuote, isFetching: isQuoteFetching } = quoteQuery;
  const realtimeUpdate = useNftRealtimeUpdate(sessionQuery.data?.user.id);
  const [reviewedQuoteId, setReviewedQuoteId] = useState<string | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 520px)');
    const update = () => setIsMobileCheckout(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (wallets.some((wallet) => wallet.id === walletId && wallet.network === network)) return;
    const nextWallet =
      wallets.find((wallet) => wallet.network === network && wallet.isPrimary) ??
      wallets.find((wallet) => wallet.network === network);
    setWalletId(nextWallet?.id ?? '');
    setWalletProvider(null);
    setWalletConnection('disconnected');
    setConnectionMessage('');
  }, [wallets, network, walletId]);
  const affectedByUpdate = Boolean(
    realtimeUpdate && cart?.items.some((item) => item.nftId === realtimeUpdate.nftId),
  );
  const quoteInvalidated = Boolean(
    affectedByUpdate &&
      quoteQuery.data &&
      realtimeUpdate &&
      new Date(realtimeUpdate.occurredAt).getTime() > new Date(quoteQuery.data.createdAt).getTime(),
  );
  const quoteNeedsReview = Boolean(
    mustReviewQuote ||
      (affectedByUpdate && quoteQuery.data && reviewedQuoteId !== quoteQuery.data.quoteId),
  );

  useEffect(() => {
    if (quoteQuery.data && !realtimeUpdate && !mustReviewQuote)
      setReviewedQuoteId(quoteQuery.data.quoteId);
  }, [quoteQuery.data, realtimeUpdate, mustReviewQuote]);

  useEffect(() => {
    if (quoteInvalidated && !isQuoteFetching) void refetchQuote();
  }, [quoteInvalidated, isQuoteFetching, refetchQuote]);

  async function connectWallet(provider: WalletProvider) {
    if (!selectedWallet) return;
    setWalletProvider(provider);
    try {
      const result = await connectWalletMutation.mutateAsync(selectedWallet.id);
      setWalletConnection(result.status);
      setConnectionMessage(result.message);
      if (result.status === 'connected') {
        window.sessionStorage.setItem('kurio.checkout.wallet-provider', provider);
        window.sessionStorage.setItem('kurio.checkout.wallet-label', selectedWallet.label);
      }
    } catch {
      setWalletConnection('disconnected');
      setConnectionMessage('Não foi possível conectar a carteira. Tente novamente.');
    }
  }

  async function finalizeConfirmedOrder(
    order: Awaited<ReturnType<typeof createOrderMutation.mutateAsync>>,
  ) {
    if (order.status === 'confirmed') {
      try {
        await consumeCartMutation.mutateAsync({
          orderId: order.id,
          items: order.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
        });
      } catch {
        // O pedido permanece confirmado; o carrinho pode ser reconciliado ao retornar à loja.
      }
    }
    if (order.status !== 'pending')
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
    await navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
  }

  async function submitOrder() {
    if (
      !quoteQuery.data ||
      quoteNeedsReview ||
      quoteQuery.isFetching ||
      walletConnection !== 'connected'
    )
      return;
    try {
      const order = await createOrderMutation.mutateAsync({
        input: { quoteId: quoteQuery.data.quoteId, walletId, network },
        idempotencyKey,
      });
      await finalizeConfirmedOrder(order);
    } catch (error) {
      if (isRequestTimeout(error)) setTimedOut(true);
      const apiError = readApiError(error);
      if (
        apiError &&
        ['CONFLICT', 'AVAILABILITY_CONFLICT', 'COUPON_EXPIRED', 'COUPON_INVALID'].includes(
          apiError.code,
        )
      ) {
        setMustReviewQuote(true);
        setReviewedQuoteId(null);
        void quoteQuery.refetch();
      }
    }
  }

  async function recoverOrder() {
    try {
      const order = await recoverOrderMutation.mutateAsync(idempotencyKey);
      await finalizeConfirmedOrder(order);
    } catch {
      // A recuperação possui feedback pelo estado da mutation e não cria uma nova tentativa.
    }
  }

  return (
    <>
      <section className="visual-page-shell checkout-page">
        <Link className="back-link" to="/checkout/collector">
          <ArrowLeft size={14} /> Início / Mercado / Dados / Pagamento
        </Link>
        <div className="checkout-layout checkout-layout-single">
          <aside
            className="checkout-summary"
            aria-labelledby={isMobileCheckout ? 'checkout-mobile-title' : 'checkout-summary-title'}
          >
            <div className="checkout-mobile-heading">
              <Link to="/cart" aria-label="Voltar ao carrinho">
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              <h1 id="checkout-mobile-title">Pagamento com carteira</h1>
              <Link to="/account/wallets" className="checkout-change-wallet">
                Trocar carteira
              </Link>
            </div>
            <h2 id="checkout-summary-title" className="checkout-items-heading">
              Seus NFTs <small>{cart?.items.length ?? 0} itens</small>
            </h2>
            {cartQuery.isPending ? <div className="visual-empty">Carregando carrinho…</div> : null}
            {cart?.items.map((item) => (
              <div className="checkout-line" key={item.nftId}>
                <img src={item.nft.imageUrl} alt="" />
                <div>
                  <strong>{item.nft.name}</strong>
                  <small>
                    {item.quantity}x · ID do token: #{item.nftId.slice(-4)}
                  </small>
                </div>
                <strong>
                  {quoteQuery.data?.items.find((line) => line.nftId === item.nftId)?.lineTotalEth ??
                    '—'}{' '}
                  ETH
                </strong>
              </div>
            ))}
            <dl className="checkout-breakdown">
              <div>
                <dt>Subtotal</dt>
                <dd>{quoteQuery.data ? `${quoteQuery.data.subtotalEth} ETH` : '—'}</dd>
              </div>
              <div>
                <dt>Desconto do lançamento</dt>
                <dd>
                  {quoteQuery.data?.discountEth ? `(-) ${quoteQuery.data.discountEth} ETH` : '—'}
                </dd>
              </div>
              <div>
                <dt>Taxa de rede</dt>
                <dd>{quoteQuery.data ? `${quoteQuery.data.networkFeeEth} ETH` : '—'}</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{quoteQuery.data?.totalEth ? `${quoteQuery.data.totalEth} ETH` : '—'}</dd>
              </div>
            </dl>
            <h3 className="checkout-wallet-heading">
              {walletConnection === 'connected' ? 'Carteira conectada' : 'Carteiras cadastradas'}
            </h3>
            {walletsQuery.isPending ? (
              <div className="visual-empty">Carregando carteiras…</div>
            ) : walletsQuery.isError ? (
              <p className="form-error" role="alert">
                Não foi possível carregar as carteiras cadastradas.
              </p>
            ) : walletOptions.length ? (
              walletOptions.map((wallet) => (
                <label className="wallet-choice" key={wallet.id}>
                  <input
                    type="radio"
                    name="wallet-choice"
                    checked={walletId === wallet.id}
                    onChange={() => {
                      setNetwork(wallet.network);
                      setWalletId(wallet.id);
                      setWalletProvider(null);
                      setWalletConnection('disconnected');
                      setConnectionMessage('');
                    }}
                    aria-label={`${wallet.label}, rede ${wallet.network}`}
                    aria-describedby={`checkout-wallet-address-${wallet.id}`}
                  />
                  <span>
                    <span className="wallet-choice-copy">
                      <strong>{wallet.label}</strong>
                      <small
                        className="wallet-choice-address"
                        id={`checkout-wallet-address-${wallet.id}`}
                        title={wallet.address}
                      >
                        {wallet.address}
                      </small>
                      <small>Rede {wallet.network}</small>
                    </span>
                  </span>
                </label>
              ))
            ) : (
              <p className="form-hint checkout-inline-feedback">
                Nenhuma carteira cadastrada. <Link to="/account/wallets">Adicionar carteira</Link>
              </p>
            )}
            <Link to="/account/wallets" className="checkout-add-wallet-link">
              + Adicionar carteira reserva
            </Link>
            <h3 className="checkout-provider-heading">Carteira e rede</h3>
            {selectedWallet ? (
              <div
                className="wallet-providers"
                role="group"
                aria-label="Provedores de carteira simulados"
              >
                {WALLET_PROVIDERS.map((provider) => (
                  <button
                    className={`wallet-provider${walletProvider === provider ? ' is-selected' : ''}`}
                    type="button"
                    key={provider}
                    aria-label={`Conectar carteira com ${provider}`}
                    aria-pressed={walletProvider === provider}
                    disabled={connectWalletMutation.isPending}
                    onClick={() => void connectWallet(provider)}
                  >
                    <span className="wallet-provider-mark" aria-hidden="true">
                      {provider === 'WalletConnect' ? <WalletConnectIcon /> : provider === 'MetaMask' ? <MetaMaskIcon /> : <CoinbaseIcon />}
                    </span>
                    <span className="wallet-provider-name">{provider}</span>
                    <span className="wallet-provider-radio" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : null}
            {selectedWallet ? (
              <div
                className={`wallet-connection is-${walletConnection}`}
                role={walletConnection === 'rejected' ? 'alert' : 'status'}
                aria-live={walletConnection === 'rejected' ? 'assertive' : 'polite'}
                aria-busy={connectWalletMutation.isPending}
              >
                <span>
                  {connectWalletMutation.isPending
                    ? 'Conectando carteira…'
                    : connectionMessage ||
                      (walletConnection === 'connected'
                        ? `${selectedWallet.label} conectada via ${walletProvider ?? 'provedor simulado'}.`
                        : 'Selecione um provedor para continuar.')}
                </span>
              </div>
            ) : null}
            {timedOut ? (
              <div
                className="form-error checkout-inline-feedback"
                role="alert"
                aria-live="assertive"
              >
                <strong>Tempo limite da rede atingido</strong>
                <span>
                  O pedido pode ter sido criado, mas a resposta não chegou. Recupere a tentativa
                  existente antes de enviar uma nova compra.
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void recoverOrder()}
                  disabled={recoverOrderMutation.isPending}
                >
                  {recoverOrderMutation.isPending ? 'Recuperando…' : 'Recuperar pedido'}
                </button>
                {recoverOrderMutation.isError ? (
                  <span>
                    Não foi possível recuperar agora. Tente novamente sem alterar a chave.
                  </span>
                ) : null}
              </div>
            ) : quoteNeedsReview ? (
              <div
                className="form-error checkout-inline-feedback"
                role="alert"
                aria-live="assertive"
              >
                <strong>A cotação foi alterada</strong>
                <span>
                  O preço ou a disponibilidade de um NFT do carrinho mudou. Uma nova cotação foi
                  carregada; revise o total antes de confirmar a compra.
                </span>
                {quoteQuery.isFetching ? (
                  <span>Atualizando cotação…</span>
                ) : quoteQuery.isError ? (
                  <span>Não foi possível carregar a nova cotação. Tente novamente.</span>
                ) : quoteQuery.data ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setReviewedQuoteId(quoteQuery.data?.quoteId ?? null);
                      setMustReviewQuote(false);
                      createOrderMutation.reset();
                    }}
                  >
                    Revisar nova cotação
                  </button>
                ) : null}
              </div>
            ) : createOrderMutation.isError || quoteQuery.isError ? (
              <p className="form-error checkout-inline-feedback" role="alert">
                A cotação mudou ou o pedido não pôde ser confirmado. Revise os dados e tente
                novamente.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => void submitOrder()}
              className="primary-button checkout-confirm"
              disabled={
                !quoteQuery.data ||
                quoteNeedsReview ||
                timedOut ||
                quoteQuery.isFetching ||
                createOrderMutation.isPending ||
                !selectedWallet ||
                walletConnection !== 'connected' ||
                !cart?.items.length
              }
            >
              {createOrderMutation.isPending ? 'Confirmando…' : 'Confirmar compra'}
            </button>
            {!cart?.items.length && !cartQuery.isPending ? (
              <Link to="/cart" className="continue-link">
                Voltar ao carrinho
              </Link>
            ) : null}
          </aside>
        </div>
      </section>
      <MarketingFooter />
    </>
  );
}
