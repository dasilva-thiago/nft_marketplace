import { useMemo, useState } from 'react';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { catalogListQuery } from '@/features/catalog/queries';
import {
  useCartQuery,
  useQuoteQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/features/cart/queries';
import { useWalletsQuery } from '@/features/wallets/queries';
import { MarketingFooter } from '@/shared/ui/marketing-footer';
import { CartLineSkeleton, CartSummarySkeleton } from '@/shared/ui/skeleton';

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

export function CartPage() {
  const cartQuery = useCartQuery();
  const recommendationsQuery = useQuery(
    catalogListQuery({ page: 1, pageSize: 4, sort: 'priceEth', sortOrder: 'asc' }),
  );
  const updateMutation = useUpdateCartItemMutation();
  const removeMutation = useRemoveCartItemMutation();
  const walletsQuery = useWalletsQuery();
  const primaryWallet =
    walletsQuery.data?.find((wallet) => wallet.isPrimary) ?? walletsQuery.data?.[0];
  const [couponDraft, setCouponDraft] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const cart = cartQuery.data;
  const quoteRequest = useMemo(
    () => ({
      items: cart?.items.map(({ nftId, quantity }) => ({ nftId, quantity })) ?? [],
      walletId: primaryWallet?.id ?? '',
      network: primaryWallet?.network ?? 'Ethereum',
      ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
    }),
    [appliedCoupon, cart?.items, primaryWallet],
  );
  const quoteQuery = useQuoteQuery(quoteRequest);
  const actionError = updateMutation.error || removeMutation.error || quoteQuery.error;

  return (
    <>
      <section className="visual-page-shell cart-page">
        <div className="cart-mobile-header">
          <Link to="/" search={homeSearch} aria-label="Voltar ao mercado">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <h1>Carrinho de NFTs</h1>
          <span aria-hidden="true" />
        </div>
        <Link className="back-link" to="/" search={homeSearch}>
          ← Início / Mercado
        </Link>
        <h1 className="cart-desktop-title">Carrinho de NFTs</h1>
        <div className="cart-layout">
          <div>
            <div className="cart-table-head">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            {cartQuery.isPending ? (
              <div aria-label="Carregando carrinho" aria-busy="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <CartLineSkeleton key={index} />
                ))}
              </div>
            ) : cartQuery.isError ? (
              <div className="visual-empty" role="alert">
                Não foi possível carregar o carrinho. Tente novamente.
              </div>
            ) : cart?.items.length ? (
              cart.items.map((item) => (
                <article className="cart-line" key={item.nftId}>
                  <img src={item.nft.imageUrl} alt={`Arte de ${item.nft.name}`} />
                  <div className="cart-line-name">
                    <strong>{item.nft.name}</strong>
                    <small>ID do token: #{String(item.nftId.length).padStart(4, '0')}</small>
                  </div>
                  <span className="cart-line-price">{item.nft.priceEth} ETH</span>
                  <div className="quantity compact">
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        void updateMutation.mutateAsync({
                          nftId: item.nftId,
                          input: { quantity: Math.max(1, item.quantity - 1) },
                        })
                      }
                      aria-label={`Diminuir ${item.nft.name}`}
                    >
                      <Minus size={12} />
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        void updateMutation.mutateAsync({
                          nftId: item.nftId,
                          input: { quantity: item.quantity + 1 },
                        })
                      }
                      aria-label={`Aumentar ${item.nft.name}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <strong className="cart-line-total">
                    {quoteQuery.data?.items.find((line) => line.nftId === item.nftId)
                      ?.lineTotalEth ?? '—'}{' '}
                    ETH
                  </strong>
                  <button
                    type="button"
                    className="icon-button"
                    disabled={removeMutation.isPending}
                    onClick={() => void removeMutation.mutateAsync(item.nftId)}
                    aria-label={`Remover ${item.nft.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </article>
              ))
            ) : (
              <div className="visual-empty">Seu carrinho está vazio.</div>
            )}
            {actionError ? (
              <p className="form-error" role="alert">
                Não foi possível atualizar o carrinho. Confira a disponibilidade e tente novamente.
              </p>
            ) : null}
          </div>
          {cartQuery.isPending ? (
            <CartSummarySkeleton />
          ) : (
            <aside className="cart-summary">
              <h2>Resumo da carteira</h2>
              <dl>
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
              <div className="cart-promo-row">
                <label>
                  <span className="sr-only">Código promocional</span>
                  <input
                    value={couponDraft}
                    onChange={(event) => setCouponDraft(event.target.value)}
                    placeholder="Digite o código promocional..."
                    aria-describedby="coupon-help"
                  />
                </label>
                <button
                  type="button"
                  className="apply-button"
                  disabled={!cart?.items.length || quoteQuery.isFetching}
                  onClick={() => setAppliedCoupon(couponDraft.trim() || undefined)}
                >
                  Aplicar
                </button>
              </div>
              <p id="coupon-help" className="field-help">
                Cupom de demonstração: KURIO10.
              </p>
              {walletsQuery.isPending ? (
                <div className="visual-empty">Carregando carteiras…</div>
              ) : primaryWallet && cart?.items.length ? (
                <Link to="/checkout/collector" className="primary-button">
                  Conectar e finalizar
                </Link>
              ) : primaryWallet ? (
                <button type="button" className="primary-button" disabled>
                  Carrinho vazio
                </button>
              ) : (
                <Link to="/account/wallets" className="primary-button">
                  Cadastrar uma carteira
                </Link>
              )}
              <Link to="/" search={homeSearch} className="continue-link">
                Continuar explorando
              </Link>
            </aside>
          )}
        </div>
        <section className="cart-recommendations">
          <div className="section-line-title">Colecionadores também viram</div>
          <div className="related-grid">
            {recommendationsQuery.data?.items.map((item) => (
              <Link key={item.id} to="/nft/$nftId" params={{ nftId: item.id }} className="visual-nft-card visual-nft-card-link">
                <div className="visual-nft-image">
                  <img src={item.imageUrl} alt={`Arte de ${item.name}`} />
                </div>
                <div className="visual-nft-meta">
                  <div>
                    <span>{item.collection}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <strong>{item.priceEth} ETH</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>
      <MarketingFooter />
    </>
  );
}
