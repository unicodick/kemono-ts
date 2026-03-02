export type Platform = "kemono" | "coomer"

export type KemonoService
    = | "afdian"
        | "boosty"
        | "subscribestar"
        | "gumroad"
        | "dlsite"
        | "patreon"
        | "fanbox"
        | "discord"
        | "fantia"

export type CoomerService = "onlyfans" | "fansly" | "candfans"

export type ServiceMap = {
    kemono: KemonoService,
    coomer: CoomerService,
}

export type PlatformService<P extends Platform> = ServiceMap[P]

export type Service = KemonoService | CoomerService

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

export type Creator = {
    favorited: number,
    id: string,
    indexed: number,
    name: string,
    service: Service,
    updated: number,
}

export type Announcement = {
    service: Service,
    user_id: string,
    hash: string,
    content: string,
    added: string,
}

export type Fancard = {
    id: number,
    user_id: string,
    file_id: number,
    hash: string,
    mtime: string,
    ctime: string,
    mime: string,
    ext: string,
    added: string,
    size: number,
    ihash: string | null,
}

export type ListPostsParams = {
    q?: string,
    o?: number,
    tag?: string[],
}

export type RandomPost = {
    service: Service,
    artist_id: string,
    post_id: string,
}
