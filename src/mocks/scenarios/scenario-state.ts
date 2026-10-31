import { z } from 'zod';

export const MockScenarioSchema = z.enum([
  'default',
  'empty',
  'slow',
  'out-of-order',
  'rate-limited',
  'unavailable',
  'session-expired',
  'payment-pending',
  'payment-rejected',
]);
export type MockScenario = z.infer<typeof MockScenarioSchema>;

const SCENARIO_STORAGE_KEY = 'kurio.mock.scenario';

function initialScenario(): MockScenario {
  const stored =
    typeof window !== 'undefined' ? window.sessionStorage.getItem(SCENARIO_STORAGE_KEY) : null;
  return MockScenarioSchema.parse(stored ?? import.meta.env.VITE_MOCK_SCENARIO ?? 'default');
}

let activeScenario: MockScenario = initialScenario();

export function getMockScenario(): MockScenario {
  return activeScenario;
}

export function setMockScenario(scenario: MockScenario): void {
  activeScenario = scenario;
  if (typeof window !== 'undefined') window.sessionStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
}

export function resetMockScenario(): void {
  activeScenario = MockScenarioSchema.parse(import.meta.env.VITE_MOCK_SCENARIO ?? 'default');
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(SCENARIO_STORAGE_KEY);
}
