import { useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCartQuery, useQuoteQuery } from '@/features/cart/queries';
import { useCreateOrderMutation } from '@/features/orders/queries';
import { MarketingFooter } from '@/shared/ui/marketing-footer';

export function CheckoutPage() {
  const navigate = useNavigate({ from: '/checkout' });
  const cartQuery = useCartQuery();
  const createOrderMutation = useCreateOrderMutation();
  const [network, setNetwork] = useState('Ethereum');
  const [walletId, setWalletId] = useState('metamask');
  const [idempotencyKey] = useState(() => `checkout-${crypto.randomUUID()}`);
  const cart = cartQuery.data;
  const quoteRequest = useMemo(
    () => ({
      items: cart?.items.map(({ nftId, quantity }) => ({ nftId, quantity })) ?? [],
      walletId,
      network,
    }),
    [cart?.items, network, walletId],
  );
  const quoteQuery = useQuoteQuery(quoteRequest);

  async function submitOrder() {
    if (!quoteQuery.data) return;
    const order = await createOrderMutation.mutateAsync({
      input: { quoteId: quoteQuery.data.quoteId, walletId, network },
      idempotencyKey,
    });
    await navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
  }

  return (
    <>
      <section className="visual-page-shell checkout-page">
        <Link className="back-link" to="/cart">
          <ArrowLeft size={14} /> Início / Mercado / Pagamento
        </Link>
        <div className="checkout-layout">
          <form
            className="collector-form"
            id="checkout-collector-form"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void submitOrder();
            }}
          >
            <h1>Perfil do colecionador</h1>
            <div className="form-grid">
              <label>
                Nome de exibição*
                <input required defaultValue="Colecionador Kurio" />
              </label>
              <label>
                Nome de usuário*
                <input required placeholder="Seu usuário" />
              </label>
              <label>
                Rede*
                <select value={network} onChange={(event) => setNetwork(event.target.value)}>
                  <option>Ethereum</option>
                  <option>Polygon</option>
                </select>
              </label>
              <label>
                Nome do perfil*
                <input required placeholder="Seu perfil" />
              </label>
              <label>
                Endereço da carteira*
                <input required placeholder="Endereço 0x da carteira" />
              </label>
              <label>
                E-mail*
                <input required type="email" placeholder="contato@email.com" />
              </label>
              <label>
                Tipo de carteira*
                <select value={walletId} onChange={(event) => setWalletId(event.target.value)}>
                  <option value="metamask">MetaMask</option>
                  <option value="coinbase">Coinbase Wallet</option>
                </select>
              </label>
              <label>
                Nome ENS
                <input placeholder=".eth" />
              </label>
            </div>
            <label className="full-field">
              Observação do colecionador (opcional)
              <textarea rows={4} />
            </label>
          </form>
          <aside className="checkout-summary">
            <h2>
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
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{quoteQuery.data?.subtotalEth ?? '0.000'} ETH</dd>
              </div>
              <div>
                <dt>Desconto do lançamento</dt>
                <dd>(-) {quoteQuery.data?.discountEth ?? '0.000'} ETH</dd>
              </div>
              <div>
                <dt>Taxa de rede</dt>
                <dd>{quoteQuery.data?.networkFeeEth ?? '0.000'} ETH</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{quoteQuery.data?.totalEth ?? '0.000'} ETH</dd>
              </div>
            </dl>
            <h3>Carteira e rede</h3>
            <label className="wallet-choice">
              <input
                type="radio"
                name="wallet-choice"
                checked={walletId === 'metamask'}
                onChange={() => setWalletId('metamask')}
              />
              <span>
                <CheckCircle2 size={15} /> MetaMask · {network}
              </span>
            </label>
            <label className="wallet-choice">
              <input
                type="radio"
                name="wallet-choice"
                checked={walletId === 'coinbase'}
                onChange={() => setWalletId('coinbase')}
              />
              <span>Coinbase Wallet · {network}</span>
            </label>
            {createOrderMutation.isError || quoteQuery.isError ? (
              <p className="form-error" role="alert">
                A cotação mudou ou o pedido não pôde ser confirmado. Revise os dados e tente
                novamente.
              </p>
            ) : null}
            <button
              type="submit"
              form="checkout-collector-form"
              className="primary-button"
              disabled={!quoteQuery.data || createOrderMutation.isPending || !cart?.items.length}
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
