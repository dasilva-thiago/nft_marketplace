import { Link } from '@tanstack/react-router';
import { Check, ExternalLink, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { catalogListQuery } from '@/features/catalog/queries';

export function OrderPage() {
  const query = useQuery(
    catalogListQuery({ page: 1, pageSize: 3, sort: 'priceEth', sortOrder: 'asc' }),
  );
  return (
    <section className="order-page">
      <div className="order-modal">
        <button type="button" className="modal-close" aria-label="Fechar">
          <X size={14} />
        </button>
        <div className="order-success">
          <Check size={25} />
          <span>
            THANK
            <br />
            YOU
          </span>
        </div>
        <p className="order-lead">Seus NFTs agora estão na sua carteira</p>
        <div className="order-meta">
          <span>
            ID da transação
            <br />
            <strong>0xA91F...E82C</strong>
          </span>
          <span>
            Data
            <br />
            <strong>29 Jul., 2026</strong>
          </span>
          <span>
            Total
            <br />
            <strong>26.846 ETH</strong>
          </span>
          <span>
            Carteira
            <br />
            <strong>MetaMask</strong>
          </span>
        </div>
        <h2>Detalhes da transação</h2>
        {query.data?.items.map((item, index) => (
          <div className="order-line" key={item.id}>
            <img src={item.imageUrl} alt="" />
            <div>
              <strong>{item.name}</strong>
              <small>ID do token: #{item.id.slice(-4)}</small>
            </div>
            <span>(x {index + 2})</span>
            <strong>{item.priceEth} ETH</strong>
          </div>
        ))}
        <dl className="order-total">
          <div>
            <dt>Taxa de rede</dt>
            <dd>0.016 ETH</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>26.846 ETH</dd>
          </div>
        </dl>
        <p className="order-note">
          Transação confirmada na Ethereum. A propriedade foi transferida para sua carteira
          conectada e registrada na rede.
        </p>
        <Link
          to="/"
          search={{
            page: 1,
            search: '',
            collection: '',
            network: '',
            trait: '',
            priceMin: '',
            priceMax: '',
            sort: 'priceEth',
            sortOrder: 'asc',
          }}
          className="primary-button"
        >
          <ExternalLink size={14} /> Ver no Etherscan
        </Link>
      </div>
    </section>
  );
}
