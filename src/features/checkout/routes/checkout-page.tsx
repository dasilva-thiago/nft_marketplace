import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { catalogListQuery } from '@/features/catalog/queries';
import { MarketingFooter } from '@/shared/ui/marketing-footer';

export function CheckoutPage() {
  const query = useQuery(
    catalogListQuery({ page: 1, pageSize: 3, sort: 'priceEth', sortOrder: 'asc' }),
  );
  return (
    <>
      <section className="visual-page-shell checkout-page">
        <Link className="back-link" to="/cart">
          <ArrowLeft size={14} /> Início / Mercado / Pagamento
        </Link>
        <div className="checkout-layout">
          <form className="collector-form">
            <h1>Perfil do colecionador</h1>
            <div className="form-grid">
              <label>
                Nome de exibição*
                <input defaultValue="Thiago Pavan" />
              </label>
              <label>
                Nome de usuário*
                <input placeholder="Seu usuário" />
              </label>
              <label>
                Rede*
                <select defaultValue="">
                  <option value="">Selecione uma rede</option>
                  <option>Ethereum</option>
                  <option>Polygon</option>
                </select>
              </label>
              <label>
                Nome do perfil*
                <input placeholder="Seu perfil" />
              </label>
              <label>
                Endereço da carteira*
                <input placeholder="Endereço 0x da carteira" />
              </label>
              <label>
                E-mail*
                <input type="email" placeholder="contato@email.com" />
              </label>
              <label>
                Tipo de carteira*
                <select defaultValue="">
                  <option value="">Selecione uma carteira</option>
                  <option>MetaMask</option>
                  <option>WalletConnect</option>
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
              Seus NFTs <small>NFTs</small>
            </h2>
            {query.data?.items.map((item) => (
              <div className="checkout-line" key={item.id}>
                <img src={item.imageUrl} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <small>ID do token: #{item.id.slice(-4)}</small>
                </div>
                <strong>{item.priceEth} ETH</strong>
              </div>
            ))}
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>26.83 ETH</dd>
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
                <dd>26.846 ETH</dd>
              </div>
            </dl>
            <h3>Carteira e rede</h3>
            <label className="wallet-choice">
              <input type="radio" name="wallet" defaultChecked />
              <span>
                <CheckCircle2 size={15} /> MetaMask
              </span>
            </label>
            <label className="wallet-choice">
              <input type="radio" name="wallet" />
              <span>Coinbase Wallet</span>
            </label>
            <Link
              to="/orders/$orderId"
              params={{ orderId: 'demo-order' }}
              className="primary-button"
            >
              Confirmar compra
            </Link>
          </aside>
        </div>
      </section>
      <MarketingFooter />
    </>
  );
}
