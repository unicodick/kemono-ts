import {
    getAnnouncements,
    getFancards,
    listCreators,
} from "@/endpoints/creators"
import { getPost, getPostRevisions, listPosts } from "@/endpoints/posts"
import type { Result } from "@/errors"
import type { HttpClientConfig } from "@/http"
import { DEFAULT_HTTP_CONFIG, PLATFORM_BASE_URLS } from "@/http"
import type {
    Announcement,
    Creator,
    Fancard,
    ListPostsParams,
    Platform,
    PlatformService,
    Post,
    PostDetail,
    PostRevision,
} from "@/types"

export type KemonoClientConfig = {
    baseUrl?: string,
    retries?: number,
    retryDelay?: number,
    timeoutMs?: number,
}

export class KemonoClient<P extends Platform = "kemono"> {
    private readonly config: HttpClientConfig

    constructor(platform: P, clientConfig: KemonoClientConfig = {}) {
        this.config = {
            ...DEFAULT_HTTP_CONFIG,
            baseUrl: PLATFORM_BASE_URLS[platform],
            ...Object.fromEntries(
                Object.entries(clientConfig).filter(([, v]) => v !== undefined),
            ),
        } as HttpClientConfig
    }

    static kemono(config: KemonoClientConfig = {}): KemonoClient<"kemono"> {
        return new KemonoClient("kemono", config)
    }

    static coomer(config: KemonoClientConfig = {}): KemonoClient<"coomer"> {
        return new KemonoClient("coomer", config)
    }

    // ── Creators ──────────────────────────────────────────────────────────────

    listCreators(): Promise<Result<Creator[]>> {
        return listCreators(this.config)
    }

    getAnnouncements(
        service: PlatformService<P>,
        creatorId: string,
    ): Promise<Result<Announcement[]>> {
        return getAnnouncements(this.config, service, creatorId)
    }

    getFancards(creatorId: string): Promise<Result<Fancard[]>> {
        return getFancards(this.config, creatorId)
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    listPosts(params?: ListPostsParams): Promise<Result<Post[]>> {
        return listPosts(this.config, params)
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
