import { buildConfig } from "@/config"
import type { HttpClientOptions } from "@/config"
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
    ListPostsParams,
    ListPostsResponse,
    PostDetail,
    PostRevision,
} from "@/types/post"

export type KemonoClientConfig = HttpClientOptions

export class KemonoClient<P extends Platform = "kemono"> {
    private readonly config = buildConfig("kemono")

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

    getFancards(creatorId: string): Promise<Result<Fancard[]>> {
        return getFancards(this.config, creatorId)
    }

    listPosts(params?: ListPostsParams): Promise<Result<ListPostsResponse>> {
        return listPosts(this.config, params)
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
