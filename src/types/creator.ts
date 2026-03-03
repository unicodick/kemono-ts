import type { Service } from "@/platforms"

export type Creator = {
    favorited: number,
    id: string,
    indexed: number,
    name: string,
    service: Service,
    updated: number,
}

export type CreatorProfile = {
    id: string,
    public_id: string,
    service: Service,
    name: string,
    // note: the API returns indexed/updated as ISO strings in profile responses,
    // unlike Creator (from listCreators) where they are UNIX timestamps (number).
    indexed: string,
    updated: string,
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

export type CreatorArtist = {
    id: string,
    name: string,
    // typed as Service; widened to string only if the API returns unlisted services.
    service: Service,
    indexed: string,
    updated: string,
    public_id: string,
    relation_id: number,
}

export type CreatorDisplayData = {
    service: Service,
    href: string,
}

export type CreatorPostsProps = {
    currentPage: string,
    id: string,
    service: Service,
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
    results: import("@/types/post").Post[],
    result_previews: Record<string, unknown>[],
    result_attachments: Record<string, unknown>[],
    result_is_image: boolean[],
    disable_service_icons: boolean,
}
