import type { HttpClientConfig } from "@/config"
import { request } from "@/http"
import type { QueryParams } from "@/http"
import type { KemonoService } from "@/platforms"
import type { Result } from "@/result"
import { err } from "@/result"
import type {
    ListPostsParams,
    Post,
    PostDetail,
    PostDetailResponse,
    PostRevision,
    RandomPost,
} from "@/types/post"

const OFFSET_STEP = 150

const toQueryParams = (params: ListPostsParams): QueryParams =>
    params as QueryParams

export const listPosts = (
    config: HttpClientConfig,
    params?: ListPostsParams,
): Promise<Result<Post[]>> => {
    if (params?.o !== undefined && params.o % OFFSET_STEP !== 0) {
        return Promise.resolve(
            err(
                "INVALID_PARAMS",
                `offset must be a multiple of ${OFFSET_STEP}`,
            ),
        )
    }

    return request<Post[]>(
        "/v1/posts",
        config,
        params ? toQueryParams(params) : undefined,
    )
}

export const getPost = async (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
    postId: string,
): Promise<Result<PostDetail>> => {
    const result = await request<PostDetailResponse>(
        `/v1/${service}/user/${creatorId}/post/${postId}`,
        config,
    )
    if (!result.ok)
        return result
    return { ok: true, value: result.value.post }
}

export const getRandomPost = async (
    config: HttpClientConfig,
): Promise<Result<PostDetail>> => {
    const ptr = await request<RandomPost>("/v1/posts/random", config)
    if (!ptr.ok)
        return ptr
    const { service, artist_id, post_id } = ptr.value
    return getPost(config, service as KemonoService, artist_id, post_id)
}

export const getPostRevisions = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
    postId: string,
): Promise<Result<PostRevision[]>> =>
    request<PostRevision[]>(
        `/v1/${service}/user/${creatorId}/post/${postId}/revisions`,
        config,
    )
