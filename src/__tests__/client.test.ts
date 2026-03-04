import { afterEach, describe, expect, it, vi } from "vitest"

import { KemonoClient } from "@/client"
import { PLATFORM_BASE_URLS } from "@/platforms"
import { mockFetch, mockFetchSequence } from "./helpers/fetch-mock"

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

    it("sends Accept: text/css by default (upstream anti-scrape workaround)", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = KemonoClient.kemono()

        await client.listCreators()

        const init = (spy.mock.calls[0] as [string, RequestInit])[1]
        expect((init.headers as Record<string, string>).Accept).toBe("text/css")
    })

    it("forwards caller-supplied headers option to fetch", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = KemonoClient.kemono({
            headers: { Accept: "application/json" },
        })

        await client.listCreators()

        const init = (spy.mock.calls[0] as [string, RequestInit])[1]
        expect((init.headers as Record<string, string>).Accept).toBe(
            "application/json",
        )
    })

    it("merges custom headers with default Accept when Accept is omitted", async () => {
        mockFetch({ status: 200, body: [] })
        const spy = vi.spyOn(globalThis, "fetch")
        const client = KemonoClient.kemono({
            headers: { "X-Trace-Id": "abc-123" },
        })

        await client.listCreators()

        const init = (spy.mock.calls[0] as [string, RequestInit])[1]
        const sent = init.headers as Record<string, string>
        expect(sent.Accept).toBe("text/css")
        expect(sent["X-Trace-Id"]).toBe("abc-123")
    })

    it("uses config-provided fetch implementation", async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: { get: () => null },
            json: () => Promise.resolve([]),
            text: () => Promise.resolve("[]"),
        } as unknown as Response)

        const client = KemonoClient.kemono({
            fetch: fetchMock as typeof fetch,
        })

        const result = await client.listCreators()

        expect(result.ok).toBe(true)
        expect(fetchMock).toHaveBeenCalledTimes(1)
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
                "/v1/creators",
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

        it("returns all declared CreatorProfile fields on success", async () => {
            const profile = {
                id: "123",
                public_id: "pub-123",
                service: "fanbox",
                name: "Test Artist",
                indexed: "2024-01-01T00:00:00Z",
                updated: "2024-06-01T00:00:00Z",
                relation_id: 42,
                post_count: 300,
                dm_count: 5,
                share_count: 12,
                chat_count: 0,
            }
            mockFetch({ status: 200, body: profile })

            const result = await client.getCreatorProfile("fanbox", "123")

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.id).toBe("123")
                expect(result.value.public_id).toBe("pub-123")
                expect(result.value.service).toBe("fanbox")
                expect(result.value.name).toBe("Test Artist")
                expect(result.value.indexed).toBe("2024-01-01T00:00:00Z")
                expect(result.value.updated).toBe("2024-06-01T00:00:00Z")
                expect(result.value.relation_id).toBe(42)
                expect(result.value.post_count).toBe(300)
                expect(result.value.dm_count).toBe(5)
                expect(result.value.share_count).toBe(12)
                expect(result.value.chat_count).toBe(0)
            }
        })

        it("relation_id may be null", async () => {
            const profile = {
                id: "456",
                public_id: "pub-456",
                service: "patreon",
                name: "Another Artist",
                indexed: "2024-02-01T00:00:00Z",
                updated: "2024-07-01T00:00:00Z",
                relation_id: null,
                post_count: 10,
                dm_count: 0,
                share_count: 0,
                chat_count: 0,
            }
            mockFetch({ status: 200, body: profile })

            const result = await client.getCreatorProfile("patreon", "456")

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.relation_id).toBeNull()
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

        it("is unavailable on coomer client at type level", () => {
            const coomer = KemonoClient.coomer()

            if (false) {
                // @ts-expect-error fancards endpoint is kemono-only
                coomer.getFancards("321")
            }

            expect(coomer).toBeDefined()
        })
    })

    describe("listPosts()", () => {
        it("hits /v1/posts", async () => {
            mockFetch({ status: 200, body: { count: 0, true_count: 0, posts: [] } })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.listPosts()

            expect((spy.mock.calls[0] as [string])[0]).toContain("/v1/posts")
        })

        it("passes search params", async () => {
            mockFetch({ status: 200, body: { count: 0, true_count: 0, posts: [] } })
            const spy = vi.spyOn(globalThis, "fetch")

            await client.listPosts({ q: "sketch", o: 300 })

            const url = (spy.mock.calls[0] as [string])[0]
            expect(url).toContain("q=sketch")
            expect(url).toContain("o=300")
        })

        it("returns envelope with count, true_count, and posts array", async () => {
            const post = {
                id: "9",
                user: "77",
                service: "patreon",
                title: "Client post",
                substring: "A preview",
                published: "2024-03-01T00:00:00Z",
                file: { name: "a.jpg", path: "/a.jpg" },
                attachments: [],
            }
            mockFetch({ status: 200, body: { count: 1, true_count: 42000, posts: [post] } })

            const result = await client.listPosts()

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.count).toBe(1)
                expect(result.value.true_count).toBe(42000)
                expect(Array.isArray(result.value.posts)).toBe(true)
                expect(result.value.posts[0]?.id).toBe("9")
            }
        })

        it("iteratePosts() walks pages until true_count is reached", async () => {
            mockFetchSequence([
                {
                    status: 200,
                    body: {
                        count: 1,
                        true_count: 2,
                        posts: [{
                            id: "1",
                            user: "u1",
                            service: "patreon",
                            title: "p1",
                            substring: "preview",
                            published: "2024-01-01",
                            file: { name: "", path: "" },
                            attachments: [],
                        }],
                    },
                },
                {
                    status: 200,
                    body: {
                        count: 1,
                        true_count: 2,
                        posts: [{
                            id: "2",
                            user: "u1",
                            service: "patreon",
                            title: "p2",
                            substring: "preview",
                            published: "2024-01-02",
                            file: { name: "", path: "" },
                            attachments: [],
                        }],
                    },
                },
            ])

            const pages = []
            for await (const result of client.iteratePosts({ q: "test" })) {
                pages.push(result)
            }

            expect(pages).toHaveLength(2)
            expect(pages[0]?.ok).toBe(true)
            expect(pages[1]?.ok).toBe(true)
            if (pages[0]?.ok && pages[1]?.ok) {
                expect(pages[0].value.posts[0]?.id).toBe("1")
                expect(pages[1].value.posts[0]?.id).toBe("2")
            }
        })
    })

    describe("getRandomPost()", () => {
        it("hits /v1/posts/random", async () => {
            const spy = mockFetchSequence([
                {
                    status: 200,
                    body: { service: "fanbox", artist_id: "1", post_id: "2" },
                },
                {
                    status: 200,
                    body: { post: { id: "2", title: "t", next: null, prev: null } },
                },
            ])

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

        it("returns all declared PostDetail fields on success", async () => {
            const inner = {
                id: "77",
                user: "20",
                service: "fanbox",
                title: "Full detail post",
                content: "Body text",
                embed: {},
                shared_file: false,
                added: "2024-04-01T00:00:00Z",
                published: "2024-04-01T00:00:00Z",
                edited: null,
                file: { name: "img.png", path: "/img.png" },
                attachments: [],
                next: "78",
                prev: "76",
                poll: null,
                captions: null,
                tags: ["fanart", "sketch"],
                incomplete_rewards: false,
            }
            mockFetch({ status: 200, body: { post: inner } })

            const result = await client.getPost("fanbox", "20", "77")

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.id).toBe("77")
                expect(result.value.next).toBe("78")
                expect(result.value.prev).toBe("76")
                expect(result.value.poll).toBeNull()
                expect(result.value.captions).toBeNull()
                expect(result.value.tags).toEqual(["fanart", "sketch"])
                expect(result.value.incomplete_rewards).toBe(false)
            }
        })

        it("poll and captions may be non-null objects", async () => {
            const poll = { question: "Favourite style?", options: ["line art", "painted"] }
            const captions = [{ language: "en", content: "A caption" }]
            const inner = {
                id: "78",
                user: "20",
                service: "fanbox",
                title: "Poll post",
                content: "",
                embed: {},
                shared_file: false,
                added: "2024-04-02T00:00:00Z",
                published: "2024-04-02T00:00:00Z",
                edited: null,
                file: { name: "", path: "" },
                attachments: [],
                next: null,
                prev: "77",
                poll,
                captions,
                tags: null,
                incomplete_rewards: null,
            }
            mockFetch({ status: 200, body: { post: inner } })

            const result = await client.getPost("fanbox", "20", "78")

            expect(result.ok).toBe(true)
            if (result.ok) {
                expect(result.value.poll).toEqual(poll)
                expect(result.value.captions).toEqual(captions)
                expect(result.value.tags).toBeNull()
                expect(result.value.incomplete_rewards).toBeNull()
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
