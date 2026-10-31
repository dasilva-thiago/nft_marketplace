import type { Cart, NftSummary } from '@/shared/contracts';

const STORAGE_KEY = 'kurio-guest-cart-v1';
type GuestLine = { nftId: string; quantity: number };

function readLines(): GuestLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is GuestLine =>
        Boolean(item) &&
        typeof item === 'object' &&
        'nftId' in item &&
        'quantity' in item &&
        typeof item.nftId === 'string' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeLines(lines: GuestLine[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function getGuestLines(): GuestLine[] {
  return readLines();
}

export function addGuestItem(nftId: string, quantity: number): void {
  const lines = readLines();
  const current = lines.find((line) => line.nftId === nftId);
  if (current) current.quantity += quantity;
  else lines.push({ nftId, quantity });
  writeLines(lines);
}

export function updateGuestItem(nftId: string, quantity: number): void {
  writeLines(readLines().map((line) => (line.nftId === nftId ? { ...line, quantity } : line)));
}

export function removeGuestItem(nftId: string): void {
  writeLines(readLines().filter((line) => line.nftId !== nftId));
}

export function clearGuestCart(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildGuestCart(nfts: NftSummary[]): Cart {
  const byId = new Map(nfts.map((nft) => [nft.id, nft]));
  return {
    userId: null,
    version: 1,
    items: readLines()
      .map((line) => {
        const nft = byId.get(line.nftId);
        return nft ? { nftId: line.nftId, quantity: line.quantity, nft } : null;
      })
      .filter((line): line is Cart['items'][number] => line !== null),
  };
}
