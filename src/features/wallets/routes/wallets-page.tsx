import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import {
  useCreateWalletMutation,
  useUpdateWalletMutation,
  useWalletsQuery,
} from '@/features/wallets/queries';
import type { Wallet } from '@/shared/contracts';

const menu = [
  'Dados do perfil',
  'Carteiras',
  'Atividade',
  'Lista de interesse',
  'Ofertas',
  'Arquivos baixados',
  'Suporte',
];

export function WalletsPage() {
  const walletsQuery = useWalletsQuery();
  const createMutation = useCreateWalletMutation();
  const updateMutation = useUpdateWalletMutation();
  const [selected, setSelected] = useState<Wallet | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<'Ethereum' | 'Polygon'>('Ethereum');

  useEffect(() => {
    if (!selected && walletsQuery.data?.[0]) {
      const wallet = walletsQuery.data[0];
      setSelected(wallet);
      setLabel(wallet.label);
      setAddress(wallet.address);
      setNetwork(wallet.network as 'Ethereum' | 'Polygon');
    }
  }, [selected, walletsQuery.data]);

  function startAdding() {
    setAdding(true);
    setSelected(null);
    setLabel('');
    setAddress('');
    setNetwork('Ethereum');
  }

  function selectWallet(wallet: Wallet) {
    setAdding(false);
    setSelected(wallet);
    setLabel(wallet.label);
    setAddress(wallet.address);
    setNetwork(wallet.network as 'Ethereum' | 'Polygon');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adding || !selected) {
      const wallet = await createMutation.mutateAsync({
        label,
        address,
        network,
        isPrimary: !walletsQuery.data?.length,
      });
      selectWallet(wallet);
      return;
    }
    await updateMutation.mutateAsync({ walletId: selected.id, input: { label, address, network } });
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.isError || updateMutation.isError;

  return (
    <section className="account-page visual-page-shell">
      <nav className="account-sidebar" aria-label="Navegação da conta">
        <h2>Meu perfil</h2>
        {menu.map((item, index) => (
          <Link
            key={item}
            className={index === 1 ? 'is-active' : ''}
            to={index === 1 ? '/account/wallets' : '/account/profile'}
          >
            {item}
          </Link>
        ))}
        <button type="button">Sair</button>
      </nav>
      <form
        className="account-form wallet-form"
        aria-labelledby="wallet-form-title"
        onSubmit={(event) => void submit(event)}
      >
        <div className="account-heading">
          <div>
            <h1 id="wallet-form-title">Carteira principal</h1>
            <p>Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
          </div>
          <button type="button" className="text-button" onClick={startAdding}>
            Adicionar
          </button>
        </div>
        {walletsQuery.data?.length ? (
          <div className="wallet-list" role="list" aria-label="Carteiras cadastradas">
            {walletsQuery.data.map((wallet) => (
              <button
                type="button"
                key={wallet.id}
                className={selected?.id === wallet.id ? 'is-active' : ''}
                onClick={() => selectWallet(wallet)}
              >
                <strong>{wallet.label}</strong>
                <span>
                  {wallet.network} · {wallet.isPrimary ? 'Principal' : 'Secundária'}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="form-grid">
          <label>
            Apelido da carteira*
            <input
              required
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Minha principal"
            />
          </label>
          <label>
            Rede*
            <select
              value={network}
              onChange={(event) => setNetwork(event.target.value as 'Ethereum' | 'Polygon')}
            >
              <option>Ethereum</option>
              <option>Polygon</option>
            </select>
          </label>
          <label>
            Endereço da carteira*
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Endereço 0x da carteira"
            />
          </label>
          <label>
            ENS ou carteira secundária (opcional)
            <input placeholder="ENS ou carteira" />
          </label>
          <label>
            Tipo de carteira*
            <select defaultValue="metamask">
              <option value="metamask">MetaMask</option>
              <option value="coinbase">Coinbase Wallet</option>
            </select>
          </label>
          <label>
            E-mail*
            <input type="email" defaultValue="contato@email.com" />
          </label>
        </div>
        {error ? (
          <p className="form-error" role="alert">
            Não foi possível salvar esta carteira.
          </p>
        ) : null}
        {createMutation.isSuccess || updateMutation.isSuccess ? (
          <p className="form-success" role="status">
            Carteira salva.
          </p>
        ) : null}
        <button
          className="primary-button"
          type="submit"
          disabled={saving || walletsQuery.isPending}
        >
          {saving ? 'Salvando…' : adding ? 'Adicionar carteira' : 'Salvar carteira'}
        </button>
        {!adding ? (
          <div className="secondary-wallet">
            <strong>Carteira secundária</strong>
            <span>
              {(walletsQuery.data?.length ?? 0) > 1
                ? 'Carteira secundária cadastrada.'
                : 'Você ainda não adicionou uma carteira secundária.'}
            </span>
            <button type="button" className="text-button" onClick={startAdding}>
              Adicionar
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}
