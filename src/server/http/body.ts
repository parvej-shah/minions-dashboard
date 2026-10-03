import { badRequest } from "./errors";

export type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function readJson(request: Request): Promise<JsonObject> {
  const body = await request.json().catch(() => null);
  if (!isObject(body)) throw badRequest("Body must be a JSON object");
  return body;
}

export async function readJsonOrEmpty(request: Request): Promise<JsonObject> {
  const body = await request.json().catch(() => null);
  return isObject(body) ? body : {};
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function asOptionalString(value: unknown, maxLength?: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return maxLength === undefined ? value : value.slice(0, maxLength);
}

export function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return typeof value === "string" && value ? [value] : [];
}

export function requireFields<K extends string>(body: JsonObject, ...keys: K[]): Record<K, string> {
  const fields = Object.fromEntries(keys.map((key) => [key, asString(body[key])])) as Record<K, string>;
  if (keys.some((key) => !fields[key])) throw badRequest(`${keys.join(" and ")} ${keys.length > 1 ? "are" : "is"} required`);
  return fields;
}
