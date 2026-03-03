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

export type RandomPost = {
    service: Service,
    artist_id: string,
    post_id: string,
}

export type ListPostsParams = {
    q?: string,
    o?: number,
    tag?: string[],
}
