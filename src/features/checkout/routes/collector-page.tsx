import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useSessionQuery } from '@/features/auth/queries';
import { useWalletsQuery } from '@/features/wallets/queries';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

const COLLECTOR_STORAGE_KEY = 'kurio.checkout.collector';

function loadCollector() {
  try {
    const raw = window.sessionStorage.getItem(COLLECTOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {}
  return null;
}

export function CollectorPage() {
  const navigate = useNavigate({ from: '/checkout/collector' });
  const sessionQuery = useSessionQuery();
  const walletsQuery = useWalletsQuery();
  const wallets = walletsQuery.data ?? [];

  const saved = typeof window !== 'undefined' ? loadCollector() : null;
  const user = sessionQuery.data?.user;

  const [displayName, setDisplayName] = useState(saved?.displayName ?? user?.name ?? '');
  const [username, setUsername] = useState(saved?.username ?? '');
  const [profileName, setProfileName] = useState(saved?.profileName ?? '');
  const [email, setEmail] = useState(saved?.email ?? '');
  const [network, setNetwork] = useState<'Ethereum' | 'Polygon'>(
    (saved?.network as 'Ethereum' | 'Polygon') ?? 'Ethereum',
  );
  const [walletId, setWalletId] = useState(saved?.walletId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const compatibleWallets = wallets.filter((w) => w.network === network);
  const selectedWallet = wallets.find((w) => w.id === walletId && w.network === network);

  function validate() {
    const next: Record<string, string> = {};
    if (!displayName.trim()) next.displayName = 'Nome de exibição obrigatório.';
    if (!username.trim()) next.username = 'Nome de usuário obrigatório.';
    if (!email.trim()) next.email = 'E-mail obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'E-mail inválido.';
    if (!walletId) next.walletId = 'Selecione uma carteira.';
    return next;
  }

  function handleNetworkChange(value: 'Ethereum' | 'Polygon') {
    setNetwork(value);
    setWalletId('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    window.sessionStorage.setItem(
      COLLECTOR_STORAGE_KEY,
      JSON.stringify({ displayName, username, profileName, email, network, walletId }),
    );
    void navigate({ to: '/checkout' });
  }

  return (
    <section className="visual-page-shell collector-page">
      <Link className="back-link" to="/cart">
        <ArrowLeft size={14} /> Início / Mercado / Dados do colecionador
      </Link>

      <div className="collector-page-layout">
        <div className="collector-page-main">
          <div className="collector-page-header">
            <p className="collector-page-step">PASSO 1 DE 2</p>
            <h1>Dados do colecionador</h1>
            <p className="collector-page-desc">
              Confirme seus dados antes de prosseguir para o pagamento.
            </p>
          </div>

          <form
            className="collector-form"
            id="checkout-collector-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-grid">
              <div className="grid gap-2">
                <Label htmlFor="checkout-display-name">Nome de exibição *</Label>
                <Input
                  id="checkout-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como você quer ser chamado"
                  aria-describedby={errors.displayName ? 'err-display-name' : undefined}
                  aria-invalid={!!errors.displayName}
                />
                {errors.displayName && (
                  <span id="err-display-name" className="field-error" role="alert">
                    {errors.displayName}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkout-username">Nome de usuário *</Label>
                <Input
                  id="checkout-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@seuusuario"
                  aria-describedby={errors.username ? 'err-username' : undefined}
                  aria-invalid={!!errors.username}
                />
                {errors.username && (
                  <span id="err-username" className="field-error" role="alert">
                    {errors.username}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkout-email">E-mail *</Label>
                <Input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@email.com"
                  aria-describedby={errors.email ? 'err-email' : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <span id="err-email" className="field-error" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkout-profile-name">Nome do perfil</Label>
                <Input
                  id="checkout-profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Nome público do seu perfil"
                />
              </div>

              <label className="grid gap-2">
                <Label htmlFor="checkout-network">Rede *</Label>
                <select
                  id="checkout-network"
                  value={network}
                  onChange={(e) => handleNetworkChange(e.target.value as 'Ethereum' | 'Polygon')}
                >
                  <option>Ethereum</option>
                  <option>Polygon</option>
                </select>
              </label>

              <div className="grid gap-2">
                <Label htmlFor="checkout-wallet">Carteira cadastrada *</Label>
                <select
                  id="checkout-wallet"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  aria-describedby={errors.walletId ? 'err-wallet' : undefined}
                  aria-invalid={!!errors.walletId}
                >
                  <option value="">Selecionar carteira…</option>
                  {compatibleWallets.length ? (
                    compatibleWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Nenhuma carteira nesta rede
                    </option>
                  )}
                </select>
                {errors.walletId && (
                  <span id="err-wallet" className="field-error" role="alert">
                    {errors.walletId}
                  </span>
                )}
              </div>
            </div>

            {selectedWallet && (
              <div className="full-field collector-wallet-address grid gap-2">
                <Label>Endereço da carteira</Label>
                <Input
                  value={selectedWallet.address}
                  readOnly
                  aria-label="Endereço da carteira selecionada"
                  className="opacity-60 cursor-default"
                />
              </div>
            )}

            {!wallets.length && !walletsQuery.isPending && (
              <p className="form-hint collector-no-wallet">
                Nenhuma carteira cadastrada.{' '}
                <Link to="/account/wallets">Cadastrar carteira</Link> antes de continuar.
              </p>
            )}

            <div className="collector-actions">
              <button
                type="submit"
                className="primary-button collector-next"
                disabled={walletsQuery.isPending}
              >
                Próximo: Pagamento <ArrowRight size={15} />
              </button>
              <Link to="/cart" className="collector-back-link">
                Voltar ao carrinho
              </Link>
            </div>
          </form>
        </div>

        <aside className="collector-page-aside">
          <div className="collector-aside-card">
            <p className="collector-aside-label">PASSO 2</p>
            <h3>Pagamento com carteira</h3>
            <p>Conecte sua carteira digital e confirme a compra com segurança.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
