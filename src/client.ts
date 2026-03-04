import { buildConfig } from "@/config"
import type { HttpClientConfig, HttpClientOptions } from "@/config"
import {
    getAnnouncements,
    getCreatorPosts,
    getCreatorProfile,
    getFancards,
    listCreators,
} from "@/endpoints/creators"
import {
    getPost,
    getPostRevisions,
    getRandomPost,
    listPosts,
    OFFSET_STEP,
} from "@/endpoints/posts"
import type { Platform, PlatformService } from "@/platforms"
import type { Result } from "@/result"
import type {
    Announcement,
    Creator,
    CreatorPostsParams,
    CreatorPostsResponse,
    CreatorProfile,
    Fancard,
} from "@/types/creator"
import type {
    ListPostsIteratorParams,
    ListPostsParams,
    ListPostsResponse,
    PostDetail,
    PostRevision,
} from "@/types/post"

export type KemonoClientConfig = HttpClientOptions

export class KemonoClient<P extends Platform = "kemono"> {
    private readonly config: HttpClientConfig

    constructor(platform: P, options: KemonoClientConfig = {}) {
        this.config = buildConfig(platform, options)
    }

    static kemono(options: KemonoClientConfig = {}): KemonoClient<"kemono"> {
        return new KemonoClient("kemono", options)
    }

    static coomer(options: KemonoClientConfig = {}): KemonoClient<"coomer"> {
        return new KemonoClient("coomer", options)
    }

    listCreators(): Promise<Result<Creator[]>> {
        return listCreators(this.config)
    }

    getAnnouncements(
        service: PlatformService<P>,
        creatorId: string,
    ): Promise<Result<Announcement[]>> {
        return getAnnouncements(this.config, service, creatorId)
    }

    getCreatorProfile(
        service: PlatformService<P>,
        creatorId: string,
    ): Promise<Result<CreatorProfile>> {
        return getCreatorProfile(this.config, service, creatorId)
    }

    getCreatorPosts(
        service: PlatformService<P>,
        creatorId: string,
        params?: CreatorPostsParams,
    ): Promise<Result<CreatorPostsResponse>> {
        return getCreatorPosts(this.config, service, creatorId, params)
    }

    getFancards(
        this: KemonoClient<"kemono">,
        creatorId: string,
    ): Promise<Result<Fancard[]>> {
        return getFancards(this.config, creatorId)
    }

    listPosts(params?: ListPostsParams): Promise<Result<ListPostsResponse>> {
        return listPosts(this.config, params)
    }

    /**
     * async iterator over paginated `/v1/posts` responses.
     *
     * stops automatically when `yieldedPosts >= true_count` or `count === 0`.
     *
     * warn: `true_count` is evaluated per-page and can grow between
     * requests on a live API. if the total keeps increasing faster than pages
     * are consumed, iteration may run longer than expected. always pass
     * `maxPages` when an upper bound on requests is required.
     */
    async* iteratePosts(
        params: ListPostsIteratorParams = {},
    ): AsyncGenerator<Result<ListPostsResponse>> {
        const { startOffset = 0, maxPages, ...listParams } = params
        let offset = startOffset
        let pages = 0
        let yieldedPosts = 0

        while (true) {
            if (maxPages !== undefined && pages >= maxPages)
                return

            const result = await this.listPosts({
                ...listParams,
                o: offset,
            })
            if (!result.ok) {
                yield result
                return
            }

            const { count, true_count } = result.value
            yield result

            pages++
            yieldedPosts += count
            if (count === 0 || yieldedPosts >= true_count)
                return

            offset += OFFSET_STEP
        }
    }

    getRandomPost(): Promise<Result<PostDetail>> {
        return getRandomPost(this.config)
    }

    getPost(
        service: PlatformService<P>,
        creatorId: string,
        postId: string,
    ): Promise<Result<PostDetail>> {
        return getPost(this.config, service, creatorId, postId)
    }

    getPostRevisions(
        service: PlatformService<P>,
        creatorId: string,
        postId: string,
    ): Promise<Result<PostRevision[]>> {
        return getPostRevisions(this.config, service, creatorId, postId)
    }
}
