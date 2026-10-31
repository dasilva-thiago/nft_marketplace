import Big from 'big.js';

// Valores ETH permanecem strings nos contratos; Big evita perda de precisão binária.
export function addEth(values: string[]): string {
  return values.reduce((sum, value) => sum.plus(value), new Big(0)).toString();
}
export function multiplyEth(priceEth: string, quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 0)
    throw new Error('A quantidade deve ser um inteiro não negativo.');
  return new Big(priceEth).times(quantity).toString();
}
export function formatEth(value: string, locale = 'pt-BR'): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(Number(value))} ETH`;
}
