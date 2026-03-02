import { afterEach, describe, expect, it, vi } from "vitest"

import { request } from "@/http"
import {
    mockFetch,
    mockFetchError,
    mockFetchSequence,
} from "./helpers/fetch-mock"

const BASE_CONFIG = {
    baseUrl: "https://kemono.cr/api",
    retries: 0,
    retryDelay: 0,
    timeoutMs: 5000,
}

const WITH_RETRIES = {
    ...BASE_CONFIG,
    retries: 2,
    retryDelay: 0,
}

afterEach(() => {
    vi.restoreAllMocks()
})

describe("request()", () => {
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

        it("returns HTTP_ERROR on 403", async () => {
            mockFetch({ status: 403, rawBody: "forbidden" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.status).toBe(403)
            }
        })

        it("returns HTTP_ERROR with fallback message when body is empty", async () => {
            mockFetch({ status: 500, rawBody: "" })

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("HTTP_ERROR")
                expect(result.error.message).toBe("HTTP 500")
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
    })

    describe("nETWORK_ERROR", () => {
        it("returns NETWORK_ERROR when fetch throws", async () => {
            mockFetchError(new Error("connection refused"))

            const result = await request("/v1/posts", BASE_CONFIG)

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("NETWORK_ERROR")
                expect(result.error.message).toBe("connection refused")
            }
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
    })
})
