import fs   from 'fs';
import path from 'path';

export interface EnvConfig {
  baseUrl: string;
  apiBaseUrl: string;
  credentials: {
    adminEmail: string;
    adminPassword: string;
  };
  orangehrmBaseUrl: string;
  orangehrmCredentials: {
    adminUsername: string;
    adminPassword: string;
  };
  reqresBaseUrl:   string;
  reqresProjectId: string;
  reqresCredentials: {
    apiKey: string;
    env:    string;
  };
}

/**
 * Recursively walks a parsed JSON value and replaces every string of the
 * form "${VAR_NAME}" with the corresponding process.env value.
 * Throws if the referenced variable is not set — no silent undefined leaking.
 */
function resolveEnvRefs(value: unknown, keyPath = ''): unknown {
  if (typeof value === 'string') {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName: string) => {
      const resolved = process.env[varName];
      if (resolved === undefined) {
        throw new Error(
          `[ConfigHelper] Environment variable "${varName}" is not set` +
          (keyPath ? ` (referenced at config key: ${keyPath})` : ''),
        );
      }
      return resolved;
    });
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => resolveEnvRefs(item, `${keyPath}[${i}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        resolveEnvRefs(v, keyPath ? `${keyPath}.${k}` : k),
      ]),
    );
  }
  return value;
}

let _cached: EnvConfig | null = null;

export const ConfigHelper = {
  /** Returns the resolved config for the current TEST_ENV (default: 'dev'). */
  getConfig(): EnvConfig {
    if (_cached) return _cached;

    const env     = process.env.TEST_ENV ?? 'dev';
    const cfgPath = path.resolve(__dirname, '../../config/env', `${env}.json`);

    if (!fs.existsSync(cfgPath)) {
      throw new Error(
        `[ConfigHelper] Config file not found for environment "${env}": ${cfgPath}`,
      );
    }

    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    _cached   = resolveEnvRefs(raw) as EnvConfig;
    return _cached;
  },
};
