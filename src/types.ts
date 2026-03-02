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

export type CreatorProfile = {
    id: string,
    public_id: string,
    service: Service,
    name: string,
    indexed: string,
    updated: string,
}

export type CreatorArtist = {
    id: string,
    name: string,
    service: string,
    indexed: string,
    updated: string,
    public_id: string,
    relation_id: number,
}

export type CreatorDisplayData = {
    service: string,
    href: string,
}

export type CreatorPostsProps = {
    currentPage: string,
    id: string,
    service: string,
    name: string,
    count: number,
    limit: number,
    artist: CreatorArtist,
    display_data: CreatorDisplayData,
    dm_count: number,
    share_count: number,
    has_links: string,
}

export type CreatorPostsParams = {
    tag?: string[],
}

export type CreatorPostsResponse = {
    props: CreatorPostsProps,
    base: Record<string, unknown>,
    results: Post[],
    result_previews: Record<string, unknown>[],
    result_attachments: Record<string, unknown>[],
    result_is_image: boolean[],
    disable_service_icons: boolean,
}
