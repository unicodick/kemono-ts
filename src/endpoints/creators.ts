import type { Result } from "@/errors"
import type { HttpClientConfig } from "@/http"
import { request } from "@/http"
import type { Announcement, Creator, Fancard } from "@/types"

export const listCreators = (
    config: HttpClientConfig,
): Promise<Result<Creator[]>> => request<Creator[]>("/v1/creators.txt", config)

export const getAnnouncements = (
    config: HttpClientConfig,
    service: string,
    creatorId: string,
): Promise<Result<Announcement[]>> =>
    request<Announcement[]>(
        `/v1/${service}/user/${creatorId}/announcements`,
        config,
    )

export const getFancards = (
    config: HttpClientConfig,
    creatorId: string,
): Promise<Result<Fancard[]>> =>
    request<Fancard[]>(`/v1/fanbox/user/${creatorId}/fancards`, config)
