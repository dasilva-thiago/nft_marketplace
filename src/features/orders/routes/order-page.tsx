import { useEffect, useState } from 'react';
import { ExternalLink, MailOpen, RefreshCw, X } from 'lucide-react';
import { Link, useParams } from '@tanstack/react-router';
import { useConsumeCartMutation } from '@/features/cart/queries';
import { useOrderQuery } from '@/features/orders/queries';

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

export function OrderPage() {
  const { orderId } = useParams({ from: '/orders/$orderId' });
  const query = useOrderQuery(orderId);
  const { mutateAsync: consumeCart } = useConsumeCartMutation();
  const order = query.data;

  useEffect(() => {
    if (order?.status !== 'confirmed') return;
    void consumeCart({
      orderId: order.id,
      items: order.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
    }).catch(() => undefined);
  }, [consumeCart, order]);

  if (query.isPending)
    return (
      <section className="order-page">
        <div className="order-modal visual-empty" aria-busy="true">
          Recuperando pedido…
        </div>
      </section>
    );

  if (query.isError || !order)
    return (
      <section className="order-page">
        <div className="order-modal visual-empty" role="alert">
          <strong>Pedido não encontrado</strong>
          <span>Consulte o histórico ou volte ao mercado.</span>
          <Link to="/" search={homeSearch} className="primary-button">
            Voltar ao mercado
          </Link>
        </div>
      </section>
    );

  const isConfirmed = order.status === 'confirmed';
  const isRejected = order.status === 'rejected';
  const [walletProvider] = useState(() =>
    window.sessionStorage.getItem('kurio.checkout.wallet-provider') ?? 'MetaMask',
  );
  const [walletLabel] = useState(() =>
    window.sessionStorage.getItem('kurio.checkout.wallet-label') ?? 'Principal',
  );

  return (
    <section className="order-page">
      <div className="order-modal">
        <Link to="/" search={homeSearch} className="modal-close" aria-label="Fechar">
          <X size={14} />
        </Link>

        {/* Hero */}
        <div className={`order-hero${isRejected ? ' is-rejected' : ''}`} aria-live="polite" aria-atomic="true">
          <div className="order-hero-icon">
            <MailOpen size={26} strokeWidth={1.6} />
          </div>
          <p className="order-hero-label">
            {isConfirmed ? 'THANK YOU' : isRejected ? 'PAYMENT FAILED' : 'ORDER PENDING'}
          </p>
          <h1 className="order-hero-title">
            {isConfirmed
              ? 'Seus NFTs agora estão na sua carteira'
              : isRejected
                ? 'O pagamento não foi confirmado'
                : 'Seu pedido está sendo processado'}
          </h1>
        </div>

        {/* Meta */}
        <div className="order-meta">
          <div className="order-meta-item">
            <span>ID do pedido</span>
            <strong>{order.id}</strong>
          </div>
          <div className="order-meta-item">
            <span>Data</span>
            <strong>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</strong>
          </div>
          <div className="order-meta-item">
            <span>Total</span>
            <strong className="order-meta-value">{order.quote.totalEth} ETH</strong>
          </div>
          <div className="order-meta-item">
            <span>Carteira</span>
            <strong>{walletLabel} · {walletProvider}</strong>
          </div>
        </div>

        {/* Items */}
        <div className="order-section">
          <h2 className="order-section-title">Itens da compra</h2>
          {order.items.map((item) => (
            <div className="order-line" key={item.nftId}>
              <img src={item.imageUrl} alt={item.name} />
              <div className="order-line-info">
                <strong>{item.name}</strong>
                <small>#{item.nftId.slice(-4)} · {item.quantity}x</small>
              </div>
              <strong className="order-line-price">{item.lineTotalEth} ETH</strong>
            </div>
          ))}
        </div>

        {/* Totals */}
        <dl className="order-total">
          <div>
            <dt>Taxa de rede</dt>
            <dd>{order.quote.networkFeeEth} ETH</dd>
          </div>
          <div className="order-total-row">
            <dt>Total</dt>
            <dd>{order.quote.totalEth} ETH</dd>
          </div>
        </dl>

        {/* Note */}
        <p className="order-note">
          {isConfirmed
            ? 'Transação confirmada no Ethereum, a propriedade foi transferida para sua carteira!'
            : isRejected
              ? 'Nenhum ativo foi removido do carrinho.'
              : 'O pedido ainda está sendo processado. Acompanhe o estado aqui e não reenvie o pagamento.'}
        </p>

        {/* CTA */}
        <div className="order-actions">
          {isConfirmed ? (
            <Link to="/" search={homeSearch} className="primary-button order-cta">
              <ExternalLink size={15} /> Ver no Etherscan
            </Link>
          ) : isRejected ? (
            <Link to="/checkout" className="primary-button order-cta">
              Nova tentativa
            </Link>
          ) : (
            <button
              type="button"
              className="primary-button order-cta"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw size={15} /> {query.isFetching ? 'Atualizando…' : 'Atualizar estado'}
            </button>
          )}
          <Link to="/" search={homeSearch} className="order-back-link">
            Voltar ao mercado
          </Link>
        </div>
      </div>
    </section>
  );
}
