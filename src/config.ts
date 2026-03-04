import { PLATFORM_BASE_URLS } from "@/platforms"
import type { Platform } from "@/platforms"

export type HttpClientConfig = {
    baseUrl: string,
    headers: Record<string, string>,
    retries: number,
    retryDelay: number,
    timeoutMs: number,
}

export type HttpClientOptions = {
    baseUrl?: string,
    headers?: Record<string, string>,
    retries?: number,
    retryDelay?: number,
    timeoutMs?: number,
}

const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1000
const DEFAULT_TIMEOUT_MS = 30_000

// the Kemono/Coomer API currently blocks requests that send `Accept:
// application/json` and instructs scrapers to use `Accept: text/css` as a
// temporary workaround. we default to that value here so the library works
// out-of-the-box against the live API. callers can restore the semantically
// correct value (or supply any other header) via the `headers` option once
// the upstream block is lifted.
const DEFAULT_ACCEPT = "text/css"

export const buildConfig = (
    platform: Platform,
    options: HttpClientOptions = {},
): HttpClientConfig => ({
    baseUrl: options.baseUrl ?? PLATFORM_BASE_URLS[platform],
    headers: options.headers ?? { Accept: DEFAULT_ACCEPT },
    retries: options.retries ?? DEFAULT_RETRIES,
    retryDelay: options.retryDelay ?? DEFAULT_RETRY_DELAY_MS,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
})
