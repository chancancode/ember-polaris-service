export function get<O extends object, K extends keyof O>(
  object: O,
  key: K,
): O[K];
export function get<T = unknown>(
  object: object,
  key: string | symbol,
): T | undefined;
export function get<O extends object, K extends keyof O>(
  object: O,
  key: K,
): O[K] {
  return object[key];
}
