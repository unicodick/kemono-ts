import type { HttpClientConfig } from "@/config"
import { request } from "@/http"
import type { QueryParams } from "@/http"
import type { Result } from "@/result"
import type {
    ListPostsParams,
    Post,
    PostDetail,
    PostDetailResponse,
    PostRevision,
    RandomPost,
} from "@/types/post"

const toQueryParams = (params: ListPostsParams): QueryParams =>
    params as QueryParams

export const listPosts = (
    config: HttpClientConfig,
    params?: ListPostsParams,
): Promise<Result<Post[]>> =>
    request<Post[]>(
        "/v1/posts",
        config,
        params ? toQueryParams(params) : undefined,
    )

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

export const getRandomPost = (
    config: HttpClientConfig,
): Promise<Result<RandomPost>> =>
    request<RandomPost>("/v1/posts/random", config)

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
