import type { Service } from "@/platforms"

export type FileAttachment = {
    name: string,
    path: string,
}

/**
 * stripped post shape returned by list endpoints (`GET /v1/posts`,
 * `GET /v1/{service}/user/{id}/posts`). the API omits `content`, `embed`,
 * `shared_file`, `added`, and `edited` in list context and adds a `substring`
 * preview field instead.  use `PostDetail` (via `getPost()`) when you need the
 * full body of a single post.
 */
export type PostSummary = {
    id: string,
    user: string,
    service: Service,
    title: string,
    /** Short plaintext preview of the post body. */
    substring: string,
    published: string,
    file: FileAttachment,
    attachments: FileAttachment[],
}

export type Post = {
    id: string,
    user: string,
    service: Service,
    title: string,
    content: string,
    embed: Record<string, unknown>,
    shared_file: boolean,
    added: string,
    published: string,
    edited: string | null,
    file: FileAttachment,
    attachments: FileAttachment[],
}

export type PostDetail = Post & {
    next: string | null,
    prev: string | null,
    // the following fields are always present on the API response object;
    // the value may be null when the post has no associated data.
    /** poll attached to the post, or null if no poll exists. */
    poll: Record<string, unknown> | null,
    /** caption/subtitle objects, or null if none are present. */
    captions: Record<string, unknown>[] | null,
    /** tag strings attached to the post, or null if untagged. */
    tags: string[] | null,
    /** true when the post has incomplete reward gates; null if not applicable. */
    incomplete_rewards: boolean | null,
}

export type PostRevision = Post & {
    revision_id: number,
}

export type PostDetailResponse = {
    post: PostDetail,
}

/**
 * internal pointer returned by `GET /v1/posts/random`.
 * not part of the public API surface — `getRandomPost()` follows this pointer
 * and resolves it to a full `PostDetail` before returning to the caller.
 */
export type RandomPost = {
    service: Service,
    artist_id: string,
    post_id: string,
}

/**
 * envelope returned by `GET /v1/posts`.
 *
 * - `count` — number of posts in the current result page.
 * - `true_count` — total number of posts across all pages (useful for
 *   computing the last valid offset: `Math.floor((true_count - 1) / 150) * 150`).
 * - `posts` — the page of post summaries.
 */
export type ListPostsResponse = {
    count: number,
    true_count: number,
    posts: PostSummary[],
}

export type ListPostsParams = {
    q?: string,
    /**
     * pagination offset. Must be a multiple of 150 (e.g. 0, 150, 300, ...).
     * passing any other value will cause the API to reject the request.
     * the client validates this before sending and returns an `INVALID_PARAMS`
     * error if the constraint is not satisfied.
     */
    o?: number,
    tag?: string[],
}

export type ListPostsIteratorParams = Omit<ListPostsParams, "o"> & {
    startOffset?: number,
    maxPages?: number,
}
