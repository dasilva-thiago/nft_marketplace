import { Check, ExternalLink, X } from 'lucide-react';
import { Link, useParams } from '@tanstack/react-router';
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
  const order = query.data;

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
  return (
    <section className="order-page">
      <div className="order-modal">
        <Link to="/" search={homeSearch} className="modal-close" aria-label="Fechar">
          <X size={14} />
        </Link>
        <div
          className={`order-success${isRejected ? ' is-rejected' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {isConfirmed ? <Check size={25} /> : <span aria-hidden="true">!</span>}
          <span>
            {isConfirmed ? (
              <>
                THANK
                <br />
                YOU
              </>
            ) : isRejected ? (
              <>
                PAYMENT
                <br />
                FAILED
              </>
            ) : (
              <>
                ORDER
                <br />
                PENDING
              </>
            )}
          </span>
        </div>
        <p className="order-lead">
          {isConfirmed
            ? 'Seus NFTs agora estão na sua carteira'
            : isRejected
              ? 'O pagamento não foi confirmado'
              : 'Seu pedido está sendo processado'}
        </p>
        <div className="order-meta">
          <span>
            ID do pedido
            <br />
            <strong>{order.id}</strong>
          </span>
          <span>
            Data
            <br />
            <strong>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</strong>
          </span>
          <span>
            Total
            <br />
            <strong>{order.quote.totalEth} ETH</strong>
          </span>
          <span>
            Status
            <br />
            <strong aria-live="polite">{order.status}</strong>
          </span>
        </div>
        <h2>Detalhes da transação</h2>
        {order.items.map((item) => (
          <div className="order-line" key={item.nftId}>
            <img src={item.imageUrl} alt="" />
            <div>
              <strong>{item.name}</strong>
              <small>
                ID do token: #{item.nftId.slice(-4)} · quantidade {item.quantity}
              </small>
            </div>
            <strong>{item.lineTotalEth} ETH</strong>
          </div>
        ))}
        <dl className="order-total">
          <div>
            <dt>Taxa de rede</dt>
            <dd>{order.quote.networkFeeEth} ETH</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{order.quote.totalEth} ETH</dd>
          </div>
        </dl>
        <p className="order-note">
          {isConfirmed
            ? `Transação simulada confirmada: ${order.transactionRef}.`
            : isRejected
              ? 'Nenhum ativo foi removido do carrinho.'
              : 'Não feche esta página; o estado poderá ser recuperado após reconexão.'}
        </p>
        {isConfirmed ? (
          <Link to="/" search={homeSearch} className="primary-button">
            <ExternalLink size={14} /> Ver no mercado
          </Link>
        ) : (
          <Link to="/checkout" className="primary-button">
            Tentar novamente
          </Link>
        )}
      </div>
    </section>
  );
}
