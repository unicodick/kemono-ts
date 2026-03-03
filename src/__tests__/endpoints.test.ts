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
import { mockFetch } from "./helpers/fetch-mock"

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
    it("calls /v1/posts/random", async () => {
        mockFetch({
            status: 200,
            body: { service: "fanbox", artist_id: "1", post_id: "2" },
        })
        const tracker = captureUrl()

        await getRandomPost(CONFIG)

        expect(tracker.get()).toBe("https://kemono.cr/api/v1/posts/random")
    })

    it("returns RandomPost shape on success", async () => {
        const payload = { service: "fanbox", artist_id: "1", post_id: "99" }
        mockFetch({ status: 200, body: payload })

        const result = await getRandomPost(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.service).toBe("fanbox")
            expect(result.value.artist_id).toBe("1")
            expect(result.value.post_id).toBe("99")
        }
    })
})
