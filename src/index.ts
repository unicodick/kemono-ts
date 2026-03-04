export { KemonoClient } from "@/client"
export type { KemonoClientConfig } from "@/client"

export type {
    CoomerService,
    KemonoService,
    Platform,
    PlatformService,
    Service,
} from "@/platforms"
export { err, ok } from "@/result"

export type { KemonoError, KemonoErrorCode, Result } from "@/result"

export type {
    Announcement,
    Creator,
    CreatorArtist,
    CreatorDisplayData,
    CreatorPostsParams,
    CreatorPostsProps,
    CreatorPostsResponse,
    CreatorProfile,
    Fancard,
} from "@/types/creator"

export type {
    FileAttachment,
    ListPostsParams,
    ListPostsResponse,
    Post,
    PostDetail,
    PostDetailResponse,
    PostRevision,
    PostSummary,
} from "@/types/post"
