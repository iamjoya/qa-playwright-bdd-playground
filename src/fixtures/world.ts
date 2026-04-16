/**
 * World — scenario-level shared context passed through fixtures.
 *
 * Carries the last API response and scenario metadata so that
 * UI → API chaining works within a single scenario without
 * awkward data-passing workarounds between step definitions.
 */

export interface ApiResponse {
  status: number;
  body: unknown;
  requestBody?: unknown;
}

export interface ScenarioMetadata {
  name: string;
  tags: string[];
  startedAt: Date;
}

export interface World {
  lastApiResponse:  ApiResponse | null;
  scenarioMetadata: ScenarioMetadata;
  lastCreatedId:    string | null;
}

export function createWorld(): World {
  return {
    lastApiResponse:  null,
    lastCreatedId:    null,
    scenarioMetadata: {
      name:      '',
      tags:      [],
      startedAt: new Date(),
    },
  };
}
