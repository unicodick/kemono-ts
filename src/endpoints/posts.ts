import type { Result } from "@/errors"
import type { HttpClientConfig } from "@/http"
import { request } from "@/http"
import type {
    ListPostsParams,
    Post,
    PostDetail,
    PostDetailResponse,
    PostRevision,
} from "@/types"

export const listPosts = (
    config: HttpClientConfig,
    params?: ListPostsParams,
): Promise<Result<Post[]>> =>
    request<Post[]>(
        "/v1/posts",
        config,
        params as Record<string, string | string[] | number | undefined>,
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
