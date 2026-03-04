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
    headers: { Accept: "text/css" },
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

        expect(tracker.get()).toBe("https://kemono.cr/api/v1/creators")
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

    it("returns HTTP_ERROR on empty-body 500", async () => {
        mockFetch({ status: 500, rawBody: "" })

        const result = await getCreatorProfile(
            CONFIG,
            "fanbox",
            "__no_such_creator__",
        )

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("HTTP_ERROR")
            expect(result.error.status).toBe(500)
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

        const result = await getCreatorProfile(CONFIG, "fanbox", "123")

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

        const result = await getCreatorProfile(CONFIG, "patreon", "456")

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.relation_id).toBeNull()
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

// Minimal valid envelope returned by GET /v1/posts
const EMPTY_LIST_RESPONSE = { count: 0, true_count: 0, posts: [] }

describe("listPosts()", () => {
    it("calls /v1/posts", async () => {
        mockFetch({ status: 200, body: EMPTY_LIST_RESPONSE })
        const tracker = captureUrl()

        await listPosts(CONFIG)

        expect(tracker.get()).toContain("/v1/posts")
    })

    it("passes q and o as query params", async () => {
        mockFetch({ status: 200, body: EMPTY_LIST_RESPONSE })
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
            mockFetch({ status: 200, body: EMPTY_LIST_RESPONSE })
            const result = await listPosts(CONFIG, { o: offset })
            expect(result.ok).toBe(true)
        }
    })

    it("omitting o skips validation and fetches successfully", async () => {
        mockFetch({ status: 200, body: EMPTY_LIST_RESPONSE })

        const result = await listPosts(CONFIG, { q: "cats" })

        expect(result.ok).toBe(true)
    })

    it("returns envelope with count, true_count, and posts array", async () => {
        const post = {
            id: "1",
            user: "42",
            service: "patreon",
            title: "My post",
            substring: "Short preview...",
            published: "2024-06-01T00:00:00Z",
            file: { name: "img.jpg", path: "/img.jpg" },
            attachments: [],
        }
        const envelope = { count: 1, true_count: 99999, posts: [post] }
        mockFetch({ status: 200, body: envelope })

        const result = await listPosts(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.count).toBe(1)
            expect(result.value.true_count).toBe(99999)
            expect(Array.isArray(result.value.posts)).toBe(true)
            expect(result.value.posts).toHaveLength(1)
            expect(result.value.posts[0]?.id).toBe("1")
            expect(result.value.posts[0]?.substring).toBe("Short preview...")
        }
    })

    it("result.value is not a bare array (envelope shape is preserved)", async () => {
        mockFetch({ status: 200, body: EMPTY_LIST_RESPONSE })

        const result = await listPosts(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(Array.isArray(result.value)).toBe(false)
            expect(result.value).toHaveProperty("posts")
            expect(result.value).toHaveProperty("count")
            expect(result.value).toHaveProperty("true_count")
        }
    })

    it("list-context posts carry substring, not content", async () => {
        const post = {
            id: "7",
            user: "10",
            service: "fanbox",
            title: "A post",
            substring: "preview text",
            published: "2024-01-01T00:00:00Z",
            file: { name: "", path: "" },
            attachments: [],
        }
        mockFetch({ status: 200, body: { count: 1, true_count: 1, posts: [post] } })

        const result = await listPosts(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            const p = result.value.posts[0]
            expect(p).toHaveProperty("substring")
            expect(p).not.toHaveProperty("content")
            expect(p).not.toHaveProperty("embed")
            expect(p).not.toHaveProperty("shared_file")
            expect(p).not.toHaveProperty("added")
            expect(p).not.toHaveProperty("edited")
        }
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

    it("returns HTTP_ERROR on empty-body 500", async () => {
        mockFetch({ status: 500, rawBody: "" })

        const result = await getPost(
            CONFIG,
            "fanbox",
            "__no_such_creator__",
            "__no_such_post__",
        )

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("HTTP_ERROR")
            expect(result.error.status).toBe(500)
        }
    })

    it("returns PARSE_ERROR when response is bare PostDetail without { post: } wrapper", async () => {
        // API returns the PostDetail directly instead of { post: PostDetail }
        const bare = { id: "42", title: "hello", next: null, prev: null }
        mockFetch({ status: 200, body: bare })

        const result = await getPost(CONFIG, "fanbox", "100", "42")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("PARSE_ERROR")
        }
    })

    it("returns PARSE_ERROR when { post: null }", async () => {
        mockFetch({ status: 200, body: { post: null } })

        const result = await getPost(CONFIG, "fanbox", "100", "42")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("PARSE_ERROR")
        }
    })

    it("returns PARSE_ERROR when post object is missing id field", async () => {
        mockFetch({ status: 200, body: { post: { title: "no id here", next: null, prev: null } } })

        const result = await getPost(CONFIG, "fanbox", "100", "42")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("PARSE_ERROR")
        }
    })

    it("returns all declared PostDetail fields on success", async () => {
        const inner = {
            id: "55",
            user: "10",
            service: "patreon",
            title: "Full post",
            content: "Post body text",
            embed: {},
            shared_file: false,
            added: "2024-03-01T00:00:00Z",
            published: "2024-03-01T00:00:00Z",
            edited: null,
            file: { name: "cover.jpg", path: "/cover.jpg" },
            attachments: [{ name: "extra.zip", path: "/extra.zip" }],
            next: "56",
            prev: "54",
            poll: null,
            captions: null,
            tags: ["art", "wip"],
            incomplete_rewards: false,
        }
        mockFetch({ status: 200, body: { post: inner } })

        const result = await getPost(CONFIG, "patreon", "10", "55")

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.id).toBe("55")
            expect(result.value.next).toBe("56")
            expect(result.value.prev).toBe("54")
            expect(result.value.poll).toBeNull()
            expect(result.value.captions).toBeNull()
            expect(result.value.tags).toEqual(["art", "wip"])
            expect(result.value.incomplete_rewards).toBe(false)
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
            poll: null,
            captions: null,
            tags: ["illustration", "sketch"],
            incomplete_rewards: false,
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
            // newly-declared optional fields
            expect(result.value.poll).toBeNull()
            expect(result.value.captions).toBeNull()
            expect(result.value.tags).toEqual(["illustration", "sketch"])
            expect(result.value.incomplete_rewards).toBe(false)
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

    it("returns PostDetail with non-null poll and captions", async () => {
        const poll = { question: "Which do you prefer?", options: ["A", "B"] }
        const captions = [{ language: "en", content: "Caption text" }]
        const postDetail = {
            id: "99",
            user: "1",
            service: "fanbox",
            title: "Poll post",
            content: "",
            embed: {},
            shared_file: false,
            added: "2024-05-01",
            published: "2024-05-01",
            edited: null,
            file: { name: "", path: "" },
            attachments: [],
            next: null,
            prev: null,
            poll,
            captions,
            tags: null,
            incomplete_rewards: null,
        }
        mockFetchSequence([
            {
                status: 200,
                body: { service: "fanbox", artist_id: "1", post_id: "99" },
            },
            { status: 200, body: { post: postDetail } },
        ])

        const result = await getRandomPost(CONFIG)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.value.poll).toEqual(poll)
            expect(result.value.captions).toEqual(captions)
            expect(result.value.tags).toBeNull()
            expect(result.value.incomplete_rewards).toBeNull()
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

    it("returns PARSE_ERROR when second fetch returns bare PostDetail without { post: } wrapper", async () => {
        // pointer fetch succeeds; post fetch returns bare object instead of envelope
        const bare = { id: "99", title: "bare", next: null, prev: null }
        mockFetchSequence([
            {
                status: 200,
                body: { service: "fanbox", artist_id: "1", post_id: "99" },
            },
            { status: 200, body: bare },
        ])

        const result = await getRandomPost(CONFIG)

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error.code).toBe("PARSE_ERROR")
        }
    })
})
