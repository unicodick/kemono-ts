import { afterEach, describe, expect, it, vi } from "vitest"

import {
    getAnnouncements,
    getCreatorPosts,
    getCreatorProfile,
    getFancards,
    listCreators,
} from "@/endpoints/creators"
import {
    getPost,
    getPostRevisions,
    getRandomPost,
    listPosts,
} from "@/endpoints/posts"
import { mockFetch, mockFetchSequence } from "./helpers/fetch-mock"

const CONFIG = {
    baseUrl: "https://kemono.cr/api",
    retries: 0,
    retryDelay: 0,
    timeoutMs: 5000,
}

afterEach(() => {
    vi.restoreAllMocks()
})

// ── helpers ───────────────────────────────────────────────────────────────────

const captureUrl = (): { get: () => string } => {
    const spy = vi.spyOn(globalThis, "fetch")
    return { get: () => (spy.mock.calls[0] as [string])[0] }
}

// ── creators ──────────────────────────────────────────────────────────────────

describe("listCreators()", () => {
    it("calls /v1/creators.txt", async () => {
        mockFetch({ status: 200, body: [] })
        const tracker = captureUrl()

        await listCreators(CONFIG)

        expect(tracker.get()).toBe("https://kemono.cr/api/v1/creators.txt")
    })

    it("returns creator list on success", async () => {
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

        const result = await listCreators(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual(payload)
        }
    })
})

describe("getCreatorProfile()", () => {
    it("calls /v1/{service}/user/{creatorId}/profile", async () => {
        mockFetch({ status: 200, body: {} })
        const tracker = captureUrl()

        await getCreatorProfile(CONFIG, "fanbox", "123")

        expect(tracker.get()).toBe(
            "https://kemono.cr/api/v1/fanbox/user/123/profile",
        )
    })

    it("returns NOT_FOUND on 404", async () => {
        mockFetch({ status: 404, rawBody: "" })

        const result = await getCreatorProfile(CONFIG, "fanbox", "999")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("NOT_FOUND")
        }
    })

    it("returns NOT_FOUND on empty-body non-404 (Kemono missing-resource pattern)", async () => {
        mockFetch({ status: 500, rawBody: "" })

        const result = await getCreatorProfile(
            CONFIG,
            "fanbox",
            "__no_such_creator__",
        )

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("NOT_FOUND")
            expect(result.error.status).toBe(500)
        }
    })
})

describe("getCreatorPosts()", () => {
    it("calls /v1/{service}/user/{creatorId}/posts", async () => {
        mockFetch({ status: 200, body: { props: {}, results: [] } })
        const tracker = captureUrl()

        await getCreatorPosts(CONFIG, "patreon", "456")

        expect(tracker.get()).toContain("/v1/patreon/user/456/posts")
    })

    it("appends tag query params", async () => {
        mockFetch({ status: 200, body: { props: {}, results: [] } })
        const tracker = captureUrl()

        await getCreatorPosts(CONFIG, "patreon", "456", {
            tag: ["art", "sketch"],
        })

        const url = tracker.get()
        expect(url).toContain("tag=art")
        expect(url).toContain("tag=sketch")
    })
})

describe("getAnnouncements()", () => {
    it("calls /v1/{service}/user/{creatorId}/announcements", async () => {
        mockFetch({ status: 200, body: [] })
        const tracker = captureUrl()

        await getAnnouncements(CONFIG, "patreon", "789")

        expect(tracker.get()).toBe(
            "https://kemono.cr/api/v1/patreon/user/789/announcements",
        )
    })
})

describe("getFancards()", () => {
    it("always calls /v1/fanbox/user/{creatorId}/fancards", async () => {
        mockFetch({ status: 200, body: [] })
        const tracker = captureUrl()

        await getFancards(CONFIG, "321")

        expect(tracker.get()).toBe(
            "https://kemono.cr/api/v1/fanbox/user/321/fancards",
        )
    })
})

// ── posts ─────────────────────────────────────────────────────────────────────

describe("listPosts()", () => {
    it("calls /v1/posts", async () => {
        mockFetch({ status: 200, body: [] })
        const tracker = captureUrl()

        await listPosts(CONFIG)

        expect(tracker.get()).toContain("/v1/posts")
    })

    it("passes q and o as query params", async () => {
        mockFetch({ status: 200, body: [] })
        const tracker = captureUrl()

        await listPosts(CONFIG, { q: "illustration", o: 150 })

        const url = tracker.get()
        expect(url).toContain("q=illustration")
        expect(url).toContain("o=150")
    })

    it("returns INVALID_PARAMS without fetching when o is not a multiple of 150", async () => {
        const spy = vi.spyOn(globalThis, "fetch")

        const result = await listPosts(CONFIG, { o: 25 })

        expect(spy).not.toHaveBeenCalled()
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("INVALID_PARAMS")
            expect(result.error.message).toBe(
                "offset must be a multiple of 150",
            )
        }
    })

    it("returns INVALID_PARAMS for any non-zero non-multiple offset", async () => {
        const spy = vi.spyOn(globalThis, "fetch")

        for (const offset of [1, 75, 149, 151, 300 + 1]) {
            const result = await listPosts(CONFIG, { o: offset })
            expect(spy).not.toHaveBeenCalled()
            expect(result.ok).toBe(false)
            if (!result.ok)
                expect(result.error.code).toBe("INVALID_PARAMS")
        }
    })

    it("accepts valid multiples of 150 without error", async () => {
        for (const offset of [0, 150, 300, 450]) {
            mockFetch({ status: 200, body: [] })
            const result = await listPosts(CONFIG, { o: offset })
            expect(result.ok).toBe(true)
        }
    })

    it("omitting o skips validation and fetches successfully", async () => {
        mockFetch({ status: 200, body: [] })

        const result = await listPosts(CONFIG, { q: "cats" })

        expect(result.ok).toBe(true)
    })
})

describe("getPost()", () => {
    it("calls /v1/{service}/user/{creatorId}/post/{postId}", async () => {
        const postPayload = {
            post: { id: "42", title: "hello", next: null, prev: null },
        }
        mockFetch({ status: 200, body: postPayload })
        const tracker = captureUrl()

        await getPost(CONFIG, "fanbox", "100", "42")

        expect(tracker.get()).toBe(
            "https://kemono.cr/api/v1/fanbox/user/100/post/42",
        )
    })

    it("unwraps { post: PostDetail } and returns PostDetail directly", async () => {
        const inner = { id: "42", title: "hello", next: "43", prev: null }
        mockFetch({ status: 200, body: { post: inner } })

        const result = await getPost(CONFIG, "fanbox", "100", "42")

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual(inner)
            expect(result.value).not.toHaveProperty("post")
        }
    })

    it("forwards error without unwrapping when request fails", async () => {
        mockFetch({ status: 404, rawBody: "" })

        const result = await getPost(CONFIG, "fanbox", "100", "nonexistent")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("NOT_FOUND")
        }
    })

    it("returns NOT_FOUND on empty-body non-404 (Kemono missing-resource pattern)", async () => {
        mockFetch({ status: 500, rawBody: "" })

        const result = await getPost(
            CONFIG,
            "fanbox",
            "__no_such_creator__",
            "__no_such_post__",
        )

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("NOT_FOUND")
            expect(result.error.status).toBe(500)
        }
    })
})

describe("getPostRevisions()", () => {
    it("calls /v1/{service}/user/{creatorId}/post/{postId}/revisions", async () => {
        mockFetch({ status: 200, body: [] })
        const tracker = captureUrl()

        await getPostRevisions(CONFIG, "fanbox", "100", "42")

        expect(tracker.get()).toBe(
            "https://kemono.cr/api/v1/fanbox/user/100/post/42/revisions",
        )
    })
})

describe("getRandomPost()", () => {
    it("first fetch calls /v1/posts/random", async () => {
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

        await getRandomPost(CONFIG)

        expect((spy.mock.calls[0] as [string])[0]).toBe(
            "https://kemono.cr/api/v1/posts/random",
        )
    })

    it("second fetch calls /v1/{service}/user/{artistId}/post/{postId}", async () => {
        const spy = mockFetchSequence([
            {
                status: 200,
                body: {
                    service: "patreon",
                    artist_id: "3438001",
                    post_id: "43417348",
                },
            },
            {
                status: 200,
                body: {
                    post: {
                        id: "43417348",
                        title: "t",
                        next: null,
                        prev: null,
                    },
                },
            },
        ])

        await getRandomPost(CONFIG)

        expect((spy.mock.calls[1] as [string])[0]).toBe(
            "https://kemono.cr/api/v1/patreon/user/3438001/post/43417348",
        )
    })

    it("returns full PostDetail (not the pointer) on success", async () => {
        const postDetail = {
            id: "43417348",
            user: "3438001",
            service: "patreon",
            title: "My post",
            content: "body text",
            embed: {},
            shared_file: false,
            added: "2024-01-01",
            published: "2024-01-01",
            edited: null,
            file: { name: "", path: "" },
            attachments: [],
            next: "43417349",
            prev: null,
        }
        mockFetchSequence([
            {
                status: 200,
                body: {
                    service: "patreon",
                    artist_id: "3438001",
                    post_id: "43417348",
                },
            },
            { status: 200, body: { post: postDetail } },
        ])

        const result = await getRandomPost(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value).toEqual(postDetail)
            // must not expose the pointer fields as the top-level shape
            expect(result.value).not.toHaveProperty("artist_id")
            expect(result.value).not.toHaveProperty("post_id")
            // must expose full PostDetail fields
            expect(result.value.id).toBe("43417348")
            expect(result.value.next).toBe("43417349")
            expect(result.value.prev).toBeNull()
        }
    })

    it("propagates error from pointer fetch without making a second request", async () => {
        const spy = vi.spyOn(globalThis, "fetch")
        mockFetch({ status: 429, rawBody: "" })

        const result = await getRandomPost(CONFIG)

        // only the pointer fetch should have been attempted
        expect(spy).toHaveBeenCalledTimes(1)
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("RATE_LIMITED")
        }
    })

    it("propagates error from post fetch when pointer succeeds but post is missing", async () => {
        mockFetchSequence([
            {
                status: 200,
                body: { service: "fanbox", artist_id: "1", post_id: "ghost" },
            },
            { status: 404, rawBody: "" },
        ])

        const result = await getRandomPost(CONFIG)

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("NOT_FOUND")
        }
    })
})
