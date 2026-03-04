import type { Service } from "@/platforms"

export type FileAttachment = {
    name: string,
    path: string,
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
