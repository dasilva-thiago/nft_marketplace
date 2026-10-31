import type { Quote } from '@/shared/contracts';

const quotes = new Map<string, Map<string, Quote>>();

export function saveQuoteForUser(userId: string, quote: Quote): Quote {
  const userQuotes = quotes.get(userId) ?? new Map<string, Quote>();
  userQuotes.set(quote.quoteId, quote);
  quotes.set(userId, userQuotes);
  return quote;
}

export function getQuoteForUser(userId: string, quoteId: string): Quote | undefined {
  return quotes.get(userId)?.get(quoteId);
}

export function resetMockQuotesState(): void {
  quotes.clear();
}
