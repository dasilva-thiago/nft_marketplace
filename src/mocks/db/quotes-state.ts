import type { Quote } from '@/shared/contracts';
import { QuoteSchema } from '@/shared/contracts/schemas';
import { readMockStorage, removeMockStorage, writeMockStorage } from './storage';

const QUOTES_STORAGE_KEY = 'kurio.mock.quotes';
type QuoteEntry = [string, Quote[]];

function initialQuotes(): Map<string, Map<string, Quote>> {
  const stored = readMockStorage<QuoteEntry[]>(QUOTES_STORAGE_KEY);
  if (!Array.isArray(stored)) return new Map();
  return new Map(
    stored
      .filter((entry): entry is QuoteEntry => Array.isArray(entry) && typeof entry[0] === 'string')
      .map(([userId, items]) => [
        userId,
        new Map(
          (Array.isArray(items) ? items : [])
            .filter((item) => QuoteSchema.safeParse(item).success)
            .map((item) => [item.quoteId, item]),
        ),
      ]),
  );
}

const quotes = initialQuotes();

function persistQuotes(): void {
  writeMockStorage(
    QUOTES_STORAGE_KEY,
    [...quotes.entries()].map(([userId, items]) => [userId, [...items.values()]]),
  );
}

export function saveQuoteForUser(userId: string, quote: Quote): Quote {
  const userQuotes = quotes.get(userId) ?? new Map<string, Quote>();
  userQuotes.set(quote.quoteId, quote);
  quotes.set(userId, userQuotes);
  persistQuotes();
  return quote;
}

export function getQuoteForUser(userId: string, quoteId: string): Quote | undefined {
  return quotes.get(userId)?.get(quoteId);
}

export function resetMockQuotesState(): void {
  quotes.clear();
  removeMockStorage(QUOTES_STORAGE_KEY);
}
