import { afterEach, describe, expect, it, vi } from "vitest"

import { KemonoClient } from "@/client"
import { PLATFORM_BASE_URLS } from "@/platforms"
import { mockFetch } from "./helpers/fetch-mock"

afterEach(() => {
    vi.restoreAllMocks()
})

// ── factory methods ───────────────────────────────────────────────────────────

describe("kemonoClient.kemono()", () => {
    it("uses kemono baseUrl", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = KemonoClient.kemono()

        await client.listCreators()

        const calledUrl = (spy.mock.calls[0] as [string])[0]
        expect(calledUrl).toContain(PLATFORM_BASE_URLS.kemono)
    })

    it("accepts optional config overrides", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = KemonoClient.kemono({ retries: 0, timeoutMs: 1000 })

        await client.listCreators()

        const calledUrl = (spy.mock.calls[0] as [string])[0]
        expect(calledUrl).toContain(PLATFORM_BASE_URLS.kemono)
    })
})

describe("kemonoClient.coomer()", () => {
    it("uses coomer baseUrl", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = KemonoClient.coomer()

        await client.listCreators()

        const calledUrl = (spy.mock.calls[0] as [string])[0]
        expect(calledUrl).toContain(PLATFORM_BASE_URLS.coomer)
    })
})

describe("new KemonoClient(platform)", () => {
    it("kemono platform sets kemono baseUrl", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = new KemonoClient("kemono")

        await client.listCreators()

        const calledUrl = (spy.mock.calls[0] as [string])[0]
        expect(calledUrl).toContain(PLATFORM_BASE_URLS.kemono)
    })

    it("coomer platform sets coomer baseUrl", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = new KemonoClient("coomer")

        await client.listCreators()

        const calledUrl = (spy.mock.calls[0] as [string])[0]
        expect(calledUrl).toContain(PLATFORM_BASE_URLS.coomer)
    })
})

// ── method delegation ─────────────────────────────────────────────────────────

describe("kemonoClient methods", () => {
    const client = KemonoClient.kemono({
        retries: 0,
        retryDelay: 0,
        timeoutMs: 5000,
    })

    describe("listCreators()", () => {
        it("hits /v1/creators.txt", async () => {
            mockFetch({ status: 200, body: [] })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.listCreators()

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/creators.txt",
            )
        })

        it("returns ok:true with creator list", async () => {
            const payload = [
                {
                    id: "1",
                    name: "artist",
                    service: "fanbox",
                    favorited: 0,
                    indexed: 0,
                    updated: 0,
                },
            ]
            mockFetch({ status: 200, body: payload })

            const result = await client.listCreators()

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value).toEqual(payload)
            }
        })
    })

    describe("getCreatorProfile()", () => {
        it("hits /v1/{service}/user/{creatorId}/profile", async () => {
            mockFetch({ status: 200, body: {} })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getCreatorProfile("fanbox", "123")

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/fanbox/user/123/profile",
            )
        })

        it("returns NOT_FOUND on 404", async () => {
            mockFetch({ status: 404, rawBody: "" })

            const result = await client.getCreatorProfile("fanbox", "999")

            expect(result.ok).toBe(false)
            if (!result.ok) {
                expect(result.error.code).toBe("NOT_FOUND")
            }
        })
    })

    describe("getCreatorPosts()", () => {
        it("hits /v1/{service}/user/{creatorId}/posts", async () => {
            mockFetch({ status: 200, body: { props: {}, results: [] } })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getCreatorPosts("patreon", "456")

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/patreon/user/456/posts",
            )
        })

        it("passes tag params", async () => {
            mockFetch({ status: 200, body: { props: {}, results: [] } })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getCreatorPosts("patreon", "456", { tag: ["cg"] })

            const url = (spy.mock.calls[0] as [string])[0]
            expect(url).toContain("tag=cg")
        })
    })

    describe("getAnnouncements()", () => {
        it("hits /v1/{service}/user/{creatorId}/announcements", async () => {
            mockFetch({ status: 200, body: [] })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getAnnouncements("patreon", "789")

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/patreon/user/789/announcements",
            )
        })
    })

    describe("getFancards()", () => {
        it("hits /v1/fanbox/user/{creatorId}/fancards", async () => {
            mockFetch({ status: 200, body: [] })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getFancards("321")

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/fanbox/user/321/fancards",
            )
        })
    })

    describe("listPosts()", () => {
        it("hits /v1/posts", async () => {
            mockFetch({ status: 200, body: [] })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.listPosts()

            expect((spy.mock.calls[0] as [string])[0]).toContain("/v1/posts")
        })

        it("passes search params", async () => {
            mockFetch({ status: 200, body: [] })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.listPosts({ q: "sketch", o: 100 })

            const url = (spy.mock.calls[0] as [string])[0]
            expect(url).toContain("q=sketch")
            expect(url).toContain("o=100")
        })
    })

    describe("getRandomPost()", () => {
        it("hits /v1/posts/random", async () => {
            mockFetch({
                status: 200,
                body: { service: "fanbox", artist_id: "1", post_id: "2" },
            })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getRandomPost()

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/posts/random",
            )
        })
    })

    describe("getPost()", () => {
        it("hits /v1/{service}/user/{creatorId}/post/{postId}", async () => {
            const inner = { id: "42", title: "t", next: null, prev: null }
            mockFetch({ status: 200, body: { post: inner } })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getPost("fanbox", "100", "42")

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/fanbox/user/100/post/42",
            )
        })

        it("returns unwrapped PostDetail", async () => {
            const inner = { id: "42", title: "hello", next: "43", prev: null }
            mockFetch({ status: 200, body: { post: inner } })

            const result = await client.getPost("fanbox", "100", "42")

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.id).toBe("42")
                expect(result.value).not.toHaveProperty("post")
            }
        })
    })

    describe("getPostRevisions()", () => {
        it("hits /v1/{service}/user/{creatorId}/post/{postId}/revisions", async () => {
            mockFetch({ status: 200, body: [] })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.getPostRevisions("fanbox", "100", "42")

            expect((spy.mock.calls[0] as [string])[0]).toContain(
                "/v1/fanbox/user/100/post/42/revisions",
            )
        })
    })
})
