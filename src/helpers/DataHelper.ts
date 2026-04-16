import fs   from 'fs';
import path from 'path';

const DATA_ROOT = path.resolve(__dirname, '../../test-data');

/** Lazy-loaded file cache: relative path → parsed JSON */
const cache = new Map<string, Record<string, unknown>>();

function loadFile(folder: string, fileName: string): Record<string, unknown> {
  const relKey  = `${folder}/${fileName}`;
  if (cache.has(relKey)) return cache.get(relKey)!;

  const filePath = path.join(DATA_ROOT, folder, `${fileName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`[DataHelper] Data file not found: ${filePath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
  cache.set(relKey, parsed);
  return parsed;
}

function getNestedValue(obj: Record<string, unknown>, keys: string[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || typeof current !== 'object') {
      throw new Error(`[DataHelper] Cannot traverse key "${key}" — current value is not an object`);
    }
    if (!(key in (current as Record<string, unknown>))) {
      throw new Error(`[DataHelper] Key "${key}" not found in data`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Loads a test-data value by dot-path.
 *
 * Path format: `<folder>.<file>.<key.path>`
 *   - folder: ui | api | shared
 *   - file:   JSON filename without extension (e.g. "login", "users")
 *   - key.path: nested key path within the file (e.g. "admin", "valid.email")
 *
 * Examples:
 *   getData('ui.login.admin')          → test-data/ui/login.json → .admin
 *   getData('api.users.createPayload') → test-data/api/users.json → .createPayload
 *
 * Returns `unknown` — callers assert the type they expect.
 */
export function getData(keyPath: string): unknown {
  const parts = keyPath.split('.');
  if (parts.length < 2) {
    throw new Error(
      `[DataHelper] keyPath must have at least "folder.file" — got: "${keyPath}"`,
    );
  }
  const [folder, fileName, ...nestedKeys] = parts;
  const file = loadFile(folder, fileName);

  if (nestedKeys.length === 0) return file;
  return getNestedValue(file, nestedKeys);
}
