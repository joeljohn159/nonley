import { env } from "./env";

export function apiUrl(path: string): string {
  return `${env.app.url}/api${path}`;
}

export function wsUrl(): string {
  return env.app.wsUrl;
}

export function cdnUrl(path: string): string {
  return `${env.app.cdnUrl}${path}`;
}
