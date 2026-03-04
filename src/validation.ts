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
    Post,
    PostDetail,
    PostDetailResponse,
    PostRevision,
    RandomPost,
} from "@/types/post"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

const isString = (value: unknown): value is string => typeof value === "string"
const isNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value)
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean"

const hasString = (value: Record<string, unknown>, key: string): boolean =>
    isString(value[key])

const hasNumber = (value: Record<string, unknown>, key: string): boolean =>
    isNumber(value[key])

const hasBoolean = (value: Record<string, unknown>, key: string): boolean =>
    isBoolean(value[key])

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

const isFileAttachment = (value: unknown): boolean => {
    if (!isRecord(value))
        return false
    return hasString(value, "name") && hasString(value, "path")
}

/**
 * validates the fields shared by {@link Post}, {@link PostDetail}, and
 * {@link PostRevision}. used as a building block by the more specific guards
 * below so that the core Post shape is validated in exactly one place.
 */
const isPost = (value: unknown): value is Post => {
    if (!isRecord(value))
        return false
    return (
        hasString(value, "id")
        && hasString(value, "user")
        && isService(value.service)
        && hasString(value, "title")
        && hasString(value, "content")
        && isRecord(value.embed)
        && hasBoolean(value, "shared_file")
        && hasString(value, "added")
        && hasString(value, "published")
        && (value.edited === null || isString(value.edited))
        && isFileAttachment(value.file)
        && Array.isArray(value.attachments)
        && (value.attachments as unknown[]).every(isFileAttachment)
    )
}

const isPostDetail = (value: unknown): value is PostDetail => {
    if (!isPost(value))
        return false
    const v = value as Record<string, unknown>
    return (
        (v.next === null || isString(v.next))
        && (v.prev === null || isString(v.prev))
        && (v.poll === null || isRecord(v.poll))
        && (v.captions === null || (Array.isArray(v.captions) && (v.captions as unknown[]).every(isRecord)))
        && (v.tags === null || (Array.isArray(v.tags) && (v.tags as unknown[]).every(isString)))
        && (v.incomplete_rewards === null || isBoolean(v.incomplete_rewards))
    )
}

export const isCreatorPostsResponse = (
    value: unknown,
): value is CreatorPostsResponse => {
    if (!isRecord(value))
        return false
    if (!isRecord(value.props))
        return false

    const props = value.props as Record<string, unknown>

    return (
        hasString(props, "currentPage")
        && hasString(props, "id")
        && isService(props.service)
        && hasString(props, "name")
        && hasNumber(props, "count")
        && hasNumber(props, "limit")
        && Array.isArray(value.results)
        && Array.isArray(value.result_previews)
        && Array.isArray(value.result_attachments)
        && Array.isArray(value.result_is_image)
        && (value.result_is_image as unknown[]).every(isBoolean)
        && isBoolean(value.disable_service_icons)
    )
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
    if (!isRecord(value))
        return false
    return isPostDetail(value.post)
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

export const isPostRevision = (value: unknown): value is PostRevision =>
    isPost(value) && hasNumber(value as Record<string, unknown>, "revision_id")

export const isPostRevisionList = (value: unknown): value is PostRevision[] =>
    Array.isArray(value) && value.every(isPostRevision)
