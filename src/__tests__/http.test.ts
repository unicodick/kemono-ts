import { afterEach, describe, expect, it, vi } from "vitest"

import { request } from "@/http"
import {
    mockFetch,
    mockFetchError,
    mockFetchSequence,
} from "./helpers/fetch-mock"

const BASE_CONFIG = {
    baseUrl: "https://kemono.cr/api",
    headers: { Accept: "text/css" },
    retries: 0,
    retryDelay: 0,
    timeoutMs: 5000,
}

const WITH_RETRIES = {
    ...BASE_CONFIG,
    headers: { Accept: "text/css" },
    retries: 2,
    retryDelay: 0,
}

const captureRequestInit = (): { get: () => RequestInit } => {
    const spy = vi.spyOn(globalThis, "fetch")
    return { get: () => (spy.mock.calls[0] as [string, RequestInit])[1] }
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe("request()", () => {
    describe("headers", () => {
        it("sends Accept: text/css by default (upstream anti-scrape workaround)", async () => {
            mockFetch({ status: 200, body: [] })
            const tracker = captureRequestInit()

            await request("/v1/creators.txt", BASE_CONFIG)

            expect(
                (tracker.get().headers as Record<string, string>).Accept,
            ).toBe("text/css")
        })

        it("forwards caller-supplied headers verbatim", async () => {
            mockFetch({ status: 200, body: [] })
            const tracker = captureRequestInit()

            await request("/v1/creators.txt", {
                ...BASE_CONFIG,
                headers: { Accept: "application/json" },
            })

            expect(
                (tracker.get().headers as Record<string, string>).Accept,
            ).toBe("application/json")
        })

        it("supports arbitrary caller-supplied header keys", async () => {
            mockFetch({ status: 200, body: [] })
            const tracker = captureRequestInit()

            await request("/v1/creators.txt", {
                ...BASE_CONFIG,
                headers: { "Accept": "text/css", "X-Custom-Header": "my-value" },
            })

            const sent = tracker.get().headers as Record<string, string>
            expect(sent.Accept).toBe("text/css")
            expect(sent["X-Custom-Header"]).toBe("my-value")
        })
    })

    describe("success", () => {
        it("returns ok:true with parsed body on 200", async () => {
            const payload = [{ id: "1", name: "artist" }]
            mockFetch({ status: 200, body: payload })

            const result = await request("/v1/creators.txt", BASE_CONFIG)

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value).toEqual(payload)
            }
        })

        it("passes query params into the URL", async () => {
            mockFetch({ status: 200, body: [] })

            const spy = vi.spyOn(globalThis, "fetch")
            await request("/v1/posts", BASE_CONFIG, { q: "art", o: 50 })

            const calledUrl = (spy.mock.calls[0] as [string])[0]
            expect(calledUrl).toContain("q=art")
            expect(calledUrl).toContain("o=50")
        })

        it("appends array params as repeated keys", async () => {
            mockFetch({ status: 200, body: [] })

            const spy = vi.spyOn(globalThis, "fetch")
            await request("/v1/posts", BASE_CONFIG, { tag: ["a", "b"] })

            const calledUrl = (spy.mock.calls[0] as [string])[0]
            expect(calledUrl).toContain("tag=a")
            expect(calledUrl).toContain("tag=b")
        })

        it("skips undefined params", async () => {
            mockFetch({ status: 200, body: [] })

            const spy = vi.spyOn(globalThis, "fetch")
            await request("/v1/posts", BASE_CONFIG, { q: undefined, o: 0 })

            const calledUrl = (spy.mock.calls[0] as [string])[0]
            expect(calledUrl).not.toContain("q=")
            expect(calledUrl).toContain("o=0")
        })
    })

    describe("hTTP errors", () => {
        it("returns NOT_FOUND on 404", async () => {
            mockFetch({ status: 404, rawBody: "not found" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("NOT_FOUND")
                expect(result.error.status).toBe(404)
            }
        })

        it("returns RATE_LIMITED on 429 (no retry)", async () => {
            mockFetch({ status: 429, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("RATE_LIMITED")
                expect(result.error.status).toBe(429)
            }
        })

        it("returns FORBIDDEN on 403", async () => {
            mockFetch({ status: 403, rawBody: "forbidden" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("FORBIDDEN")
                expect(result.error.status).toBe(403)
            }
        })

        it("returns HTTP_ERROR on empty-body 500", async () => {
            mockFetch({ status: 500, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.status).toBe(500)
            }
        })

        it("returns HTTP_ERROR on empty-body 302", async () => {
            mockFetch({ status: 302, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.status).toBe(302)
            }
        })

        it("returns HTTP_ERROR on whitespace-only body 5xx", async () => {
            mockFetch({ status: 500, rawBody: "   " })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                // whitespace is truthy so it is preserved as-is rather than
                // replaced by the "HTTP 500" fallback, which only fires for ""
                expect(result.error.message).toBe("   ")
            }
        })

        it("returns HTTP_ERROR on empty-body 400 (bad request is not NOT_FOUND)", async () => {
            mockFetch({ status: 400, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.status).toBe(400)
            }
        })

        it("returns UNAUTHORIZED on empty-body 401", async () => {
            mockFetch({ status: 401, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("UNAUTHORIZED")
                expect(result.error.status).toBe(401)
            }
        })

        it("returns FORBIDDEN on empty-body 403", async () => {
            mockFetch({ status: 403, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("FORBIDDEN")
                expect(result.error.status).toBe(403)
            }
        })

        it("returns HTTP_ERROR on empty-body 410 (gone is not NOT_FOUND)", async () => {
            mockFetch({ status: 410, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.status).toBe(410)
            }
        })

        it("returns HTTP_ERROR with body message when body is non-empty", async () => {
            mockFetch({ status: 500, rawBody: "internal server error" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.message).toBe("internal server error")
                expect(result.error.status).toBe(500)
            }
        })
    })

    describe("pARSE_ERROR", () => {
        it("returns PARSE_ERROR when response is not valid JSON", async () => {
            mockFetch({ status: 200, rawBody: "not-json{{" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("PARSE_ERROR")
            }
        })

        it("returns PARSE_ERROR when validator rejects response shape", async () => {
            mockFetch({ status: 200, body: { nope: true } })

            const result = await request<string[]>(
                "/v1/posts",
                BASE_CONFIG,
                undefined,
                value => Array.isArray(value),
            )

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("PARSE_ERROR")
                expect(result.error.message).toBe("Unexpected response shape")
            }
        })
    })

    describe("network failures", () => {
        it("returns NETWORK_ERROR when fetch throws", async () => {
            mockFetchError(new Error("connection refused"))

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("NETWORK_ERROR")
                expect(result.error.message).toBe("connection refused")
            }
        })

        it("returns TIMEOUT on AbortError", async () => {
            const abortError = new DOMException("The operation was aborted", "AbortError")
            mockFetchError(abortError)

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("TIMEOUT")
            }
        })

        it("uses custom fetch implementation from config", async () => {
            const fetchMock = vi.fn().mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: () => null },
                json: () => Promise.resolve([]),
                text: () => Promise.resolve("[]"),
            } as unknown as Response)

            const result = await request("/v1/posts", {
                ...BASE_CONFIG,
                fetch: fetchMock as typeof fetch,
            })

            expect(result.ok).toBe(true)
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })
    })

    describe("retry", () => {
        it("retries on 500 and returns ok after recovery", async () => {
            mockFetchSequence([
                { status: 500, rawBody: "error" },
                { status: 200, body: { id: "1" } },
            ])

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(result.ok).toBe(true)
        })

        it("retries on 429 and returns ok after recovery", async () => {
            mockFetchSequence([
                { status: 429, rawBody: "" },
                { status: 200, body: [] },
            ])

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(result.ok).toBe(true)
        })

        it("exhausts all retries and returns the last error", async () => {
            mockFetchSequence([
                { status: 500, rawBody: "err1" },
                { status: 500, rawBody: "err2" },
                { status: 500, rawBody: "err3" },
            ])

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
            }
        })

        it("retries on network error and returns ok after recovery", async () => {
            const spy = vi.spyOn(globalThis, "fetch")

            spy.mockRejectedValueOnce(new Error("socket hang up"))
            spy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: { get: () => null },
                json: () => Promise.resolve([]),
                text: () => Promise.resolve("[]"),
            } as unknown as Response)

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(result.ok).toBe(true)
        })

        it("does NOT retry on 404", async () => {
            const spy = mockFetchSequence([
                { status: 404, rawBody: "" },
                { status: 200, body: [] },
            ])

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(spy).toHaveBeenCalledTimes(1)
            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("NOT_FOUND")
            }
        })

        it("respects Retry-After header on 429", async () => {
            mockFetchSequence([
                {
                    status: 429,
                    rawBody: "",
                    headers: { "retry-after": "0" },
                },
                { status: 200, body: [] },
            ])

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(result.ok).toBe(true)
        })

        it("accepts Retry-After HTTP-date format on 429", async () => {
            mockFetchSequence([
                {
                    status: 429,
                    rawBody: "",
                    headers: { "retry-after": "Mon, 01 Jan 1990 00:00:00 GMT" },
                },
                { status: 200, body: [] },
            ])

            const result = await request("/v1/posts", WITH_RETRIES)

            expect(result.ok).toBe(true)
        })
    })
})
