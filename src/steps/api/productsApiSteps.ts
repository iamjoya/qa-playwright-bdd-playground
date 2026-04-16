import { expect }             from '@playwright/test';
import { Given, When, Then }   from '@fixtures/index';
import { getData }              from '@helpers/DataHelper';
import { ConfigHelper }         from '@helpers/ConfigHelper';
import { attachApiPayload }     from '@helpers/AllureHelper';

// ── Module-level helpers ──────────────────────────────────────────────────────

function buildHeaders(
  config: ReturnType<typeof ConfigHelper.getConfig>,
  includeContentType = false,
): Record<string, string> {
  return {
    'x-api-key':    config.reqresCredentials.apiKey,
    'X-Reqres-Env': config.reqresCredentials.env,
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
  };
}

function buildUrl(
  config: ReturnType<typeof ConfigHelper.getConfig>,
  suffix = '',
): string {
  return (
    `${config.reqresBaseUrl}/api/collections/products/records` +
    `${suffix}?project_id=${config.reqresProjectId}`
  );
}

// ── Given: create product as prerequisite for GET / PUT scenarios ─────────────

Given(
  'I have created a product with {string} data',
  async ({ request, world }, dataKey: string) => {
    const config      = ConfigHelper.getConfig();
    const requestBody = getData(`api.products.payloads.${dataKey}`);

    const response = await request.post(buildUrl(config), {
      data:    requestBody,
      headers: buildHeaders(config, true),
    });

    // reqres.in wraps the record under body.data — id lives at body.data.id
    const body   = await response.json().catch(() => ({})) as { data?: { id?: string; [k: string]: unknown }; [k: string]: unknown };
    const record = body.data ?? {};

    world.lastApiResponse = { status: response.status(), body, requestBody };
    world.lastCreatedId   = record.id ?? null;

    // Inline guard: if the prerequisite POST fails the scenario should stop here
    // with a clear message rather than propagating a null id to downstream steps.
    try {
      expect(response.status()).toBe(201);
      expect(world.lastCreatedId).toBeTruthy();
    } catch (error) {
      await attachApiPayload('Prerequisite POST Request Body',  requestBody);
      await attachApiPayload('Prerequisite POST Response Body', body);
      throw error;
    }
  },
);

// ── When: POST — create a product ─────────────────────────────────────────────

When(
  'I send a POST request to create a product with {string} data',
  async ({ request, world }, dataKey: string) => {
    const config      = ConfigHelper.getConfig();
    const requestBody = getData(`api.products.payloads.${dataKey}`);

    const response = await request.post(buildUrl(config), {
      data:    requestBody,
      headers: buildHeaders(config, true),
    });

    // reqres.in wraps the record under body.data — id lives at body.data.id
    const body   = await response.json().catch(() => ({})) as { data?: { id?: string; [k: string]: unknown }; [k: string]: unknown };
    const record = body.data ?? {};

    world.lastCreatedId   = record.id ?? null;
    world.lastApiResponse = { status: response.status(), body, requestBody };
  },
);

// ── When: POST — no API key (expects 401) ────────────────────────────────────

When('I send an unauthenticated POST request to create a product', async ({ request, world }) => {
  const config      = ConfigHelper.getConfig();
  const requestBody = getData('api.products.payloads.valid');

  // Intentionally omit all auth headers to verify the API enforces authentication.
  const response = await request.post(buildUrl(config), {
    data:    requestBody,
    headers: { 'Content-Type': 'application/json' },
  });

  const body = await response.json().catch(() => ({}));

  world.lastApiResponse = { status: response.status(), body, requestBody };
});

// ── When: POST — invalid API key (expects 401) ────────────────────────────────

When('I send a POST request with an invalid API key to create a product', async ({ request, world }) => {
  const config      = ConfigHelper.getConfig();
  const requestBody = getData('api.products.payloads.valid');
  const badApiKey   = getData('api.products.invalidApiKey') as string;

  const response = await request.post(buildUrl(config), {
    data:    requestBody,
    headers: {
      'x-api-key':      badApiKey,
      'X-Reqres-Env':   config.reqresCredentials.env,
      'Content-Type':   'application/json',
    },
  });

  const body = await response.json().catch(() => ({}));

  world.lastApiResponse = { status: response.status(), body, requestBody };
});

// ── When: GET — retrieve the product created in this scenario ─────────────────

When('I send a GET request to retrieve the created product', async ({ request, world }) => {
  // Race condition guard: world.lastCreatedId must be set by the POST/Given step.
  // A null id here means the prerequisite step failed or was skipped — fail fast
  // with a clear message instead of sending a malformed request.
  if (!world.lastCreatedId) {
    throw new Error(
      'Race condition guard: world.lastCreatedId is null — ' +
      'the POST/Given step must complete successfully before GET can run',
    );
  }

  const config = ConfigHelper.getConfig();

  const response = await request.get(buildUrl(config, `/${world.lastCreatedId}`), {
    headers: buildHeaders(config),
  });

  const body = await response.json().catch(() => ({}));

  world.lastApiResponse = { status: response.status(), body };
});

// ── When: GET — retrieve a product by id from test data (negative path) ───────

When(
  'I send a GET request for product id {string}',
  async ({ request, world }, idKey: string) => {
    const config = ConfigHelper.getConfig();
    const id     = getData(`api.products.${idKey}`) as string;

    const response = await request.get(buildUrl(config, `/${id}`), {
      headers: buildHeaders(config),
    });

    const body = await response.json().catch(() => ({}));

    world.lastApiResponse = { status: response.status(), body };
  },
);

// ── When: PUT — update the product created in this scenario ───────────────────

When(
  'I send a PUT request to update the product with {string} data',
  async ({ request, world }, dataKey: string) => {
    // Race condition guard: same reasoning as GET.
    if (!world.lastCreatedId) {
      throw new Error(
        'Race condition guard: world.lastCreatedId is null — ' +
        'the POST/Given step must complete successfully before PUT can run',
      );
    }

    const config      = ConfigHelper.getConfig();
    const requestBody = getData(`api.products.payloads.${dataKey}`);

    const response = await request.put(buildUrl(config, `/${world.lastCreatedId}`), {
      data:    requestBody,
      headers: buildHeaders(config, true),
    });

    const body = await response.json().catch(() => ({}));

    world.lastApiResponse = { status: response.status(), body, requestBody };
  },
);

// ── When: PUT — update a product by id from test data (negative path) ─────────

When(
  'I send a PUT request to update product id {string} with {string} data',
  async ({ request, world }, idKey: string, dataKey: string) => {
    const config      = ConfigHelper.getConfig();
    const id          = getData(`api.products.${idKey}`) as string;
    const requestBody = getData(`api.products.payloads.${dataKey}`);

    const response = await request.put(buildUrl(config, `/${id}`), {
      data:    requestBody,
      headers: buildHeaders(config, true),
    });

    const body = await response.json().catch(() => ({}));

    world.lastApiResponse = { status: response.status(), body, requestBody };
  },
);

// ── Then: assert response status ─────────────────────────────────────────────

Then(
  'the products API response status should match {string}',
  async ({ world }, expectedKey: string) => {
    const { statusCode } = getData(`api.products.expectedResponses.${expectedKey}`) as {
      statusCode: number;
    };

    try {
      expect(world.lastApiResponse?.status).toBe(statusCode);
    } catch (error) {
      await attachApiPayload('Request Body',  world.lastApiResponse?.requestBody);
      await attachApiPayload('Response Body', world.lastApiResponse?.body);
      throw error;
    }
  },
);

// ── Then: assert response body matches mock/expected template ─────────────────

Then(
  'the products API response body should contain the expected fields for {string}',
  async ({ world }, expectedKey: string) => {
    const { bodyContains } = getData(`api.products.expectedResponses.${expectedKey}`) as {
      bodyContains: Record<string, unknown>;
    };

    // reqres.in wraps the record under body.data — assert fields against that layer.
    const record = (
      (world.lastApiResponse?.body as Record<string, unknown>)?.['data'] ?? {}
    ) as Record<string, unknown>;

    try {
      for (const [key, value] of Object.entries(bodyContains)) {
        expect(record[key]).toEqual(value);
      }
    } catch (error) {
      await attachApiPayload('Request Body',  world.lastApiResponse?.requestBody);
      await attachApiPayload('Response Body', world.lastApiResponse?.body);
      throw error;
    }
  },
);
