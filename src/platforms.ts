export type Platform = "kemono" | "coomer"

export type KemonoService
    = | "afdian"
        | "boosty"
        | "subscribestar"
        | "gumroad"
        | "dlsite"
        | "patreon"
        | "fanbox"
        | "discord"
        | "fantia"

export type CoomerService = "onlyfans" | "fansly" | "candfans"

export type ServiceMap = {
    kemono: KemonoService,
    coomer: CoomerService,
}

export type PlatformService<P extends Platform> = ServiceMap[P]

export type Service = KemonoService | CoomerService

export const PLATFORM_BASE_URLS: Record<Platform, string> = {
    kemono: "https://kemono.cr/api",
    coomer: "https://coomer.st/api",
}
