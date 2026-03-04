import type { HttpClientConfig } from "@/config"
import { encodePathSegment, request } from "@/http"
import type { QueryParams } from "@/http"
import type { Result } from "@/result"
import type {
    Announcement,
    Creator,
    CreatorPostsParams,
    CreatorPostsResponse,
    CreatorProfile,
    Fancard,
} from "@/types/creator"
import {
    isAnnouncement,
    isCreator,
    isCreatorPostsResponse,
    isCreatorProfile,
    isFancard,
} from "@/validation"

const toQueryParams = (params: CreatorPostsParams): QueryParams =>
    params as QueryParams

const isCreatorList = (value: unknown): value is Creator[] =>
    Array.isArray(value) && value.every(isCreator)
const isAnnouncementList = (value: unknown): value is Announcement[] =>
    Array.isArray(value) && value.every(isAnnouncement)
const isFancardList = (value: unknown): value is Fancard[] =>
    Array.isArray(value) && value.every(isFancard)

export const listCreators = (
    config: HttpClientConfig,
): Promise<Result<Creator[]>> => request<Creator[]>("/v1/creators", config, undefined, isCreatorList)

export const getCreatorProfile = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
): Promise<Result<CreatorProfile>> =>
    request<CreatorProfile>(
        `/v1/${encodePathSegment(service)}/user/${encodePathSegment(creatorId)}/profile`,
        config,
        undefined,
        isCreatorProfile,
    )

export const getCreatorPosts = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
    params?: CreatorPostsParams,
): Promise<Result<CreatorPostsResponse>> =>
    request<CreatorPostsResponse>(
        `/v1/${encodePathSegment(service)}/user/${encodePathSegment(creatorId)}/posts`,
        config,
        params ? toQueryParams(params) : undefined,
        isCreatorPostsResponse,
    )

export const getAnnouncements = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
): Promise<Result<Announcement[]>> =>
    request<Announcement[]>(
        `/v1/${encodePathSegment(service)}/user/${encodePathSegment(creatorId)}/announcements`,
        config,
        undefined,
        isAnnouncementList,
    )

/**
 * fetches fancards for a Fanbox creator.
 *
 * note: this endpoint is Fanbox-specific and is only available on the
 * Kemono platform. calling it via a `KemonoClient.coomer()` instance will
 * result in a `NOT_FOUND` error because the Coomer API does not expose this
 * route.
 */
export const getFancards = (
    config: HttpClientConfig,
    creatorId: string,
): Promise<Result<Fancard[]>> =>
    request<Fancard[]>(
        `/v1/fanbox/user/${encodePathSegment(creatorId)}/fancards`,
        config,
        undefined,
        isFancardList,
    )
