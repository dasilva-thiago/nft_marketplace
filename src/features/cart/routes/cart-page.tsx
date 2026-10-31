import Big from 'big.js';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { catalogListQuery } from '@/features/catalog/queries';
import { MarketingFooter } from '@/shared/ui/marketing-footer';
import { useState } from 'react';

export function CartPage() {
  const query = useQuery(
    catalogListQuery({ page: 1, pageSize: 4, sort: 'priceEth', sortOrder: 'asc' }),
  );
  const items = query.data?.items ?? [];
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const quantityOf = (id: string) => quantities[id] ?? 1;
  const subtotal = items.reduce(
    (sum, item) => sum.plus(new Big(item.priceEth).times(quantityOf(item.id))),
    new Big(0),
  );
  return (
    <>
      <section className="visual-page-shell cart-page">
        <Link
          className="back-link"
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
        >
          ← Início / Mercado
        </Link>
        <div className="cart-layout">
          <div>
            <h1>Carrinho de NFTs</h1>
            <div className="cart-table-head">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            {query.isPending ? (
              <div className="visual-empty">Carregando carrinho…</div>
            ) : (
              items.map((item) => {
                const quantity = quantityOf(item.id);
                return (
                  <article className="cart-line" key={item.id}>
                    <img src={item.imageUrl} alt="" />
                    <div className="cart-line-name">
                      <strong>{item.name}</strong>
                      <small>ID do token: #{String(item.id.length).padStart(4, '0')}</small>
                    </div>
                    <span className="cart-line-price">{item.priceEth} ETH</span>
                    <div className="quantity compact">
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities((current) => ({
                            ...current,
                            [item.id]: Math.max(1, quantity - 1),
                          }))
                        }
                        aria-label={`Diminuir ${item.name}`}
                      >
                        <Minus size={12} />
                      </button>
                      <strong>{quantity}</strong>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantities((current) => ({ ...current, [item.id]: quantity + 1 }))
                        }
                        aria-label={`Aumentar ${item.name}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <strong className="cart-line-total">
                      {new Big(item.priceEth).times(quantity).toFixed(2)} ETH
                    </strong>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </article>
                );
              })
            )}
          </div>
          <aside className="cart-summary">
            <h2>Resumo da carteira</h2>
            <label>
              Código promocional
              <input placeholder="Digite o código promocional..." />
            </label>
            <button type="button" className="apply-button">
              Aplicar
            </button>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{subtotal.toFixed(2)} ETH</dd>
              </div>
              <div>
                <dt>Desconto do lançamento</dt>
                <dd>(-) 00.00</dd>
              </div>
              <div>
                <dt>Taxa de rede</dt>
                <dd>0.016 ETH</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{subtotal.plus('0.016').toFixed(3)} ETH</dd>
              </div>
            </dl>
            <Link to="/checkout" className="primary-button">
              Conectar e finalizar
            </Link>
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
              className="continue-link"
            >
              Continuar explorando
            </Link>
          </aside>
        </div>
        <section className="cart-recommendations">
          <div className="section-line-title">Colecionadores também viram</div>
          <div className="related-grid">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="visual-nft-card">
                <img src={item.imageUrl} alt={`Arte de ${item.name}`} />
                <div className="visual-nft-meta">
                  <div>
                    <span>{item.collection}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <strong>{item.priceEth} ETH</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
      <MarketingFooter />
    </>
  );
}
