import { z } from 'zod';

export const MockScenarioSchema = z.enum(['default', 'empty', 'slow', 'out-of-order', 'rate-limited', 'unavailable']);
export type MockScenario = z.infer<typeof MockScenarioSchema>;

let activeScenario: MockScenario = MockScenarioSchema.parse(import.meta.env.VITE_MOCK_SCENARIO ?? 'default');

export function getMockScenario(): MockScenario {
  return activeScenario;
}

export function setMockScenario(scenario: MockScenario): void {
  activeScenario = scenario;
}

export function resetMockScenario(): void {
  activeScenario = MockScenarioSchema.parse(import.meta.env.VITE_MOCK_SCENARIO ?? 'default');
}
