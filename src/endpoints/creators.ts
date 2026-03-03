import type { HttpClientConfig } from "@/config";
import { request } from "@/http";
import type { QueryParams } from "@/http";
import type { Result } from "@/result";
import type {
    Announcement,
    Creator,
    CreatorPostsParams,
    CreatorPostsResponse,
    CreatorProfile,
    Fancard,
} from "@/types/creator";

const toQueryParams = (params: CreatorPostsParams): QueryParams =>
    params as QueryParams;

export const listCreators = (
    config: HttpClientConfig,
): Promise<Result<Creator[]>> => request<Creator[]>("/v1/creators.txt", config);

export const getCreatorProfile = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
): Promise<Result<CreatorProfile>> =>
    request<CreatorProfile>(`/v1/${service}/user/${creatorId}/profile`, config);

export const getCreatorPosts = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
    params?: CreatorPostsParams,
): Promise<Result<CreatorPostsResponse>> =>
    request<CreatorPostsResponse>(
        `/v1/${service}/user/${creatorId}/posts`,
        config,
        params ? toQueryParams(params) : undefined,
    );

export const getAnnouncements = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
): Promise<Result<Announcement[]>> =>
    request<Announcement[]>(
        `/v1/${service}/user/${creatorId}/announcements`,
        config,
    );

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
    request<Fancard[]>(`/v1/fanbox/user/${creatorId}/fancards`, config);
