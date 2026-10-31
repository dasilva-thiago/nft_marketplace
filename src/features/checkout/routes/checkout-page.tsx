import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSessionQuery } from '@/features/auth/queries';
import { readApiError } from '@/features/auth/api/auth-api';
import { useCartQuery, useConsumeCartMutation, useQuoteQuery } from '@/features/cart/queries';
import { useCreateOrderMutation, useRecoverOrderMutation } from '@/features/orders/queries';
import {
  useConnectWalletMutation,
  useDisconnectWalletMutation,
  useWalletsQuery,
} from '@/features/wallets/queries';
import { useNftRealtimeUpdate } from '@/realtime/realtime-signal';
import { MarketingFooter } from '@/shared/ui/marketing-footer';
import type { WalletConnectionStatus } from '@/shared/contracts';

const CHECKOUT_IDEMPOTENCY_STORAGE_KEY = 'kurio.checkout.idempotency-key';
const WALLET_PROVIDERS = ['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const;
type WalletProvider = (typeof WALLET_PROVIDERS)[number];

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
  const disconnectWalletMutation = useDisconnectWalletMutation();
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
    } catch {
      setWalletConnection('disconnected');
      setConnectionMessage('Não foi possível conectar a carteira. Tente novamente.');
    }
  }

  async function disconnectWallet() {
    if (!selectedWallet) return;
    try {
      const result = await disconnectWalletMutation.mutateAsync(selectedWallet.id);
      setWalletConnection(result.status);
      setConnectionMessage(result.message);
    } catch {
      setConnectionMessage('Não foi possível desconectar a carteira. Tente novamente.');
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
        <Link className="back-link" to="/cart">
          <ArrowLeft size={14} /> Início / Mercado / Pagamento
        </Link>
        <div className="checkout-layout">
          <form
            className="collector-form checkout-desktop-form"
            id="checkout-collector-form"
            aria-labelledby="checkout-form-title"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void submitOrder();
            }}
          >
            <h1 id="checkout-form-title">Perfil do colecionador</h1>
            <div className="form-grid">
              <label>
                Nome de exibição*
                <input
                  id="checkout-display-name"
                  required={!isMobileCheckout}
                  defaultValue="Colecionador Kurio"
                />
              </label>
              <label>
                Nome de usuário*
                <input
                  id="checkout-username"
                  required={!isMobileCheckout}
                  placeholder="Seu usuário"
                />
              </label>
              <label>
                Rede*
                <select
                  id="checkout-network"
                  required={!isMobileCheckout}
                  value={network}
                  onChange={(event) => {
                    setNetwork(event.target.value as 'Ethereum' | 'Polygon');
                    setWalletId('');
                    setWalletProvider(null);
                    setWalletConnection('disconnected');
                    setConnectionMessage('');
                  }}
                >
                  <option>Ethereum</option>
                  <option>Polygon</option>
                </select>
              </label>
              <label>
                Nome do perfil*
                <input
                  id="checkout-profile-name"
                  required={!isMobileCheckout}
                  placeholder="Seu perfil"
                />
              </label>
              <label>
                Endereço da carteira*
                <input
                  id="checkout-wallet-address"
                  required={!isMobileCheckout}
                  value={selectedWallet?.address ?? ''}
                  readOnly
                  placeholder="Endereço 0x da carteira"
                />
              </label>
              <label>
                E-mail*
                <input
                  id="checkout-email"
                  required={!isMobileCheckout}
                  type="email"
                  placeholder="contato@email.com"
                />
              </label>
              <label>
                Carteira cadastrada*
                <select
                  id="checkout-wallet"
                  required={!isMobileCheckout}
                  value={walletId}
                  onChange={(event) => {
                    setWalletId(event.target.value);
                    setWalletConnection('disconnected');
                    setConnectionMessage('');
                  }}
                >
                  {compatibleWallets.length ? (
                    compatibleWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Nenhuma carteira nesta rede
                    </option>
                  )}
                </select>
              </label>
              <label>
                Nome ENS
                <input id="checkout-ens" placeholder=".eth" />
              </label>
            </div>
            <label className="full-field">
              Observação do colecionador (opcional)
              <textarea id="checkout-note" rows={4} />
            </label>
          </form>
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
                    disabled={connectWalletMutation.isPending || disconnectWalletMutation.isPending}
                    onClick={() => void connectWallet(provider)}
                  >
                    <span className="wallet-provider-mark" aria-hidden="true">
                      {provider === 'WalletConnect' ? 'W' : provider === 'MetaMask' ? 'M' : 'C'}
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
                aria-busy={connectWalletMutation.isPending || disconnectWalletMutation.isPending}
              >
                <span>
                  {connectWalletMutation.isPending
                    ? 'Conectando carteira…'
                    : connectionMessage ||
                      (walletConnection === 'connected'
                        ? `${selectedWallet.label} conectada via ${walletProvider ?? 'provedor simulado'}.`
                        : 'Selecione um provedor para continuar.')}
                </span>
                {walletConnection === 'connected' ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void disconnectWallet()}
                    disabled={connectWalletMutation.isPending || disconnectWalletMutation.isPending}
                  >
                    {disconnectWalletMutation.isPending ? 'Aguarde…' : 'Desconectar carteira'}
                  </button>
                ) : null}
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
              type="submit"
              form="checkout-collector-form"
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
