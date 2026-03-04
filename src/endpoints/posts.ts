import type { HttpClientConfig } from "@/config"
import { encodePathSegment, request } from "@/http"
import type { QueryParams } from "@/http"
import type { Result } from "@/result"
import { err, ok } from "@/result"
import type {
    ListPostsParams,
    ListPostsResponse,
    PostDetail,
    PostDetailResponse,
    PostRevision,
    RandomPost,
} from "@/types/post"
import {
    isListPostsResponse,
    isPostDetailResponse,
    isPostRevisionList,
    isRandomPost,
} from "@/validation"

const OFFSET_STEP = 150

const toQueryParams = (params: ListPostsParams): QueryParams =>
    params as QueryParams

export const listPosts = async (
    config: HttpClientConfig,
    params?: ListPostsParams,
): Promise<Result<ListPostsResponse>> => {
    if (params?.o !== undefined && (params.o < 0 || params.o % OFFSET_STEP !== 0)) {
        return err(
            "INVALID_PARAMS",
            `offset must be a non-negative multiple of ${OFFSET_STEP}`,
        )
    }

    return request<ListPostsResponse>(
        "/v1/posts",
        config,
        params ? toQueryParams(params) : undefined,
        isListPostsResponse,
    )
}

export const getPost = async (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
    postId: string,
): Promise<Result<PostDetail>> => {
    const result = await request<PostDetailResponse>(
        `/v1/${encodePathSegment(service)}/user/${encodePathSegment(creatorId)}/post/${encodePathSegment(postId)}`,
        config,
        undefined,
        isPostDetailResponse,
    )
    if (!result.ok)
        return result

    return ok(result.value.post)
}

export const getRandomPost = async (
    config: HttpClientConfig,
): Promise<Result<PostDetail>> => {
    const ptr = await request<RandomPost>(
        "/v1/posts/random",
        config,
        undefined,
        isRandomPost,
    )
    if (!ptr.ok)
        return ptr
    const { service, artist_id, post_id } = ptr.value
    return getPost(config, service, artist_id, post_id)
}

export const getPostRevisions = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
    postId: string,
): Promise<Result<PostRevision[]>> =>
    request<PostRevision[]>(
        `/v1/${encodePathSegment(service)}/user/${encodePathSegment(creatorId)}/post/${encodePathSegment(postId)}/revisions`,
        config,
        undefined,
        isPostRevisionList,
    )
