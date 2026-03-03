import type { HttpClientConfig } from "@/config"
import type { KemonoError, Result } from "@/result"
import { err, ok } from "@/result"

const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms))

const isRetryable = (status: number): boolean =>
    status === 429 || status >= 500

const mapHttpError = (status: number, body: string): KemonoError => {
    if (status === 404)
        return { code: "NOT_FOUND", message: "Resource not found", status }
    if (status === 429)
        return { code: "RATE_LIMITED", message: "Rate limit exceeded", status }
    // the Kemono/Coomer API does not consistently return 404 for missing
    // resources. some endpoints (e.g. /profile, /post/:id) respond with a
    // non-2xx status and an empty body when a creator or post ID is invalid.
    // an empty body on a non-2xx response carries no diagnostic information, so
    // we treat it as NOT_FOUND to honour the library's documented contract and
    // spare callers from having to special-case the raw HTTP status themselves.
    if (body.trim() === "")
        return { code: "NOT_FOUND", message: "Resource not found", status }
    return { code: "HTTP_ERROR", message: body || `HTTP ${status}`, status }
}

const parseRetryAfter = (response: Response): number | null => {
    const header = response.headers.get("Retry-After")
    if (!header)
        return null
    const seconds = Number(header)
    return Number.isFinite(seconds) ? seconds * 1000 : null
}

export type QueryParams = Record<
    string,
    string | string[] | number | undefined
>

const applyParams = (url: URL, params: QueryParams): void => {
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined)
            continue
        if (Array.isArray(value)) {
            for (const item of value) url.searchParams.append(key, item)
        } else {
            url.searchParams.set(key, String(value))
        }
    }
}

export const request = async <T>(
    path: string,
    config: HttpClientConfig,
    params?: QueryParams,
): Promise<Result<T>> => {
    const url = new URL(`${config.baseUrl}${path}`)
    if (params)
        applyParams(url, params)

    let attempt = 0

    while (attempt <= config.retries) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), config.timeoutMs)

        try {
            const response = await fetch(url.toString(), {
                headers: { Accept: "application/json" },
                signal: controller.signal,
            })

            clearTimeout(timer)

            if (response.ok) {
                try {
                    const data = (await response.json()) as T
                    return ok(data)
                } catch {
                    return err("PARSE_ERROR", "Failed to parse JSON response")
                }
            }

            const body = await response.text().catch(() => "")

            if (isRetryable(response.status) && attempt < config.retries) {
                const delay
                    = response.status === 429
                        ? (parseRetryAfter(response)
                            ?? config.retryDelay * 2 ** attempt)
                        : config.retryDelay * 2 ** attempt
                await sleep(delay)
                attempt++
                continue
            }

            return { ok: false, error: mapHttpError(response.status, body) }
        } catch (thrown) {
            clearTimeout(timer)

            if (
                thrown instanceof DOMException
                && thrown.name === "AbortError"
            ) {
                return err(
                    "NETWORK_ERROR",
                    `Request timed out after ${config.timeoutMs}ms`,
                )
            }

            if (attempt < config.retries) {
                await sleep(config.retryDelay * 2 ** attempt)
                attempt++
                continue
            }

            const message
                = thrown instanceof Error
                    ? thrown.message
                    : "Unknown network error"
            return err("NETWORK_ERROR", message)
        }
    }

    return err("NETWORK_ERROR", "Max retries exceeded")
}
