import { isService } from "@/platforms"
import type {
    Announcement,
    Creator,
    CreatorPostsResponse,
    CreatorProfile,
    Fancard,
} from "@/types/creator"
import type {
    ListPostsResponse,
    PostDetailResponse,
    PostRevision,
    RandomPost,
} from "@/types/post"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

const isString = (value: unknown): value is string => typeof value === "string"
const isNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value)

const hasString = (value: Record<string, unknown>, key: string): boolean =>
    isString(value[key])

const hasNumber = (value: Record<string, unknown>, key: string): boolean =>
    isNumber(value[key])

export const isCreator = (value: unknown): value is Creator => {
    if (!isRecord(value))
        return false
    return (
        hasString(value, "id")
        && hasString(value, "name")
        && isService(value.service)
        && hasNumber(value, "favorited")
        && hasNumber(value, "indexed")
        && hasNumber(value, "updated")
    )
}

export const isCreatorProfile = (value: unknown): value is CreatorProfile => {
    if (!isRecord(value))
        return false

    return (
        hasString(value, "id")
        && hasString(value, "public_id")
        && isService(value.service)
        && hasString(value, "name")
        && hasString(value, "indexed")
        && hasString(value, "updated")
        && (value.relation_id === null || isNumber(value.relation_id))
        && hasNumber(value, "post_count")
        && hasNumber(value, "dm_count")
        && hasNumber(value, "share_count")
        && hasNumber(value, "chat_count")
    )
}

export const isAnnouncement = (value: unknown): value is Announcement => {
    if (!isRecord(value))
        return false
    return (
        isService(value.service)
        && hasString(value, "user_id")
        && hasString(value, "hash")
        && hasString(value, "content")
        && hasString(value, "added")
    )
}

export const isFancard = (value: unknown): value is Fancard => {
    if (!isRecord(value))
        return false

    return (
        hasNumber(value, "id")
        && hasString(value, "user_id")
        && hasNumber(value, "file_id")
        && hasString(value, "hash")
        && hasString(value, "mtime")
        && hasString(value, "ctime")
        && hasString(value, "mime")
        && hasString(value, "ext")
        && hasString(value, "added")
        && hasNumber(value, "size")
        && (value.ihash === null || isString(value.ihash))
    )
}

export const isCreatorPostsResponse = (
    value: unknown,
): value is CreatorPostsResponse => {
    if (!isRecord(value))
        return false
    return isRecord(value.props) && Array.isArray(value.results)
}

export const isListPostsResponse = (value: unknown): value is ListPostsResponse => {
    if (!isRecord(value))
        return false
    return (
        hasNumber(value, "count")
        && hasNumber(value, "true_count")
        && Array.isArray(value.posts)
    )
}

export const isPostDetailResponse = (
    value: unknown,
): value is PostDetailResponse => {
    if (!isRecord(value) || !isRecord(value.post))
        return false
    return hasString(value.post, "id")
}

export const isRandomPost = (value: unknown): value is RandomPost => {
    if (!isRecord(value))
        return false
    return (
        isService(value.service)
        && hasString(value, "artist_id")
        && hasString(value, "post_id")
    )
}

export const isPostRevision = (value: unknown): value is PostRevision => {
    if (!isRecord(value))
        return false
    return hasString(value, "id") && hasNumber(value, "revision_id")
}

export const isPostRevisionList = (value: unknown): value is PostRevision[] =>
    Array.isArray(value) && value.every(isPostRevision)
