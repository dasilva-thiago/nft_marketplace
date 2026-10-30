import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export function HomePage() {
  return <section className="page-shell"><p className="eyebrow">DESAFIO FRONTEND · FUNDAÇÃO</p><h1>Marketplace de NFTs</h1><p className="lead">Estrutura de aplicação preparada para evoluir os fluxos do desafio.</p><div className="notice" role="status"><strong>Base arquitetural, não produto concluído.</strong><br />Catálogo, autenticação, carrinho, pagamento e conta ainda precisam de implementação funcional integrada às APIs simuladas.</div><div className="route-links"><Link to="/cart" className={cn(buttonVariants())}>Carrinho</Link><Link to="/checkout">Pagamento</Link><Link to="/account/profile">Perfil</Link><Link to="/account/wallets">Carteiras</Link></div></section>;
}
