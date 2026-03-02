import {
    getAnnouncements,
    getFancards,
    listCreators,
} from "@/endpoints/creators"
import { getPost, getPostRevisions, listPosts } from "@/endpoints/posts"
import type { Result } from "@/errors"
import type { HttpClientConfig } from "@/http"
import { DEFAULT_HTTP_CONFIG } from "@/http"
import type {
    Announcement,
    Creator,
    Fancard,
    ListPostsParams,
    Post,
    PostDetail,
    PostRevision,
    Service,
} from "@/types"

export type KemonoClientConfig = {
    baseUrl?: string,
    retries?: number,
    retryDelay?: number,
    timeoutMs?: number,
}

export class KemonoClient {
    private readonly config: HttpClientConfig

    constructor(clientConfig: KemonoClientConfig = {}) {
        this.config = {
            ...DEFAULT_HTTP_CONFIG,
            ...Object.fromEntries(
                Object.entries(clientConfig).filter(([, v]) => v !== undefined),
            ),
        } as HttpClientConfig
    }

    listCreators(): Promise<Result<Creator[]>> {
        return listCreators(this.config)
    }

    getAnnouncements(
        service: Service,
        creatorId: string,
    ): Promise<Result<Announcement[]>> {
        return getAnnouncements(this.config, service, creatorId)
    }

    getFancards(creatorId: string): Promise<Result<Fancard[]>> {
        return getFancards(this.config, creatorId)
    }

    listPosts(params?: ListPostsParams): Promise<Result<Post[]>> {
        return listPosts(this.config, params)
    }

    getPost(
        service: Service,
        creatorId: string,
        postId: string,
    ): Promise<Result<PostDetail>> {
        return getPost(this.config, service, creatorId, postId)
    }

    getPostRevisions(
        service: Service,
        creatorId: string,
        postId: string,
    ): Promise<Result<PostRevision[]>> {
        return getPostRevisions(this.config, service, creatorId, postId)
    }
}
