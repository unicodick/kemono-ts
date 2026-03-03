import { PLATFORM_BASE_URLS } from "@/platforms"
import type { Platform } from "@/platforms"

export type HttpClientConfig = {
    baseUrl: string,
    retries: number,
    retryDelay: number,
    timeoutMs: number,
}

export type HttpClientOptions = {
    baseUrl?: string,
    retries?: number,
    retryDelay?: number,
    timeoutMs?: number,
}

const DEFAULT_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 1000
const DEFAULT_TIMEOUT_MS = 30_000

export const DEFAULT_HTTP_CONFIG: HttpClientConfig = {
    baseUrl: PLATFORM_BASE_URLS.kemono,
    retries: DEFAULT_RETRIES,
    retryDelay: DEFAULT_RETRY_DELAY_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
}

export const buildConfig = (
    platform: Platform,
    options: HttpClientOptions = {},
): HttpClientConfig => ({
    baseUrl: PLATFORM_BASE_URLS[platform],
    retries: options.retries ?? DEFAULT_RETRIES,
    retryDelay: options.retryDelay ?? DEFAULT_RETRY_DELAY_MS,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
})
