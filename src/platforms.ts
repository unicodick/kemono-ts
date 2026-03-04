export type Platform = "kemono" | "coomer"

export const KEMONO_SERVICES = [
    "afdian",
    "boosty",
    "subscribestar",
    "gumroad",
    "dlsite",
    "patreon",
    "fanbox",
    "discord",
    "fantia",
] as const

export const COOMER_SERVICES = ["onlyfans", "fansly", "candfans"] as const

export type KemonoService
    = (typeof KEMONO_SERVICES)[number]

export type CoomerService = (typeof COOMER_SERVICES)[number]

export type ServiceMap = {
    kemono: KemonoService,
    coomer: CoomerService,
}

export type PlatformService<P extends Platform> = ServiceMap[P]

export type Service = KemonoService | CoomerService

const SERVICE_SET = new Set<string>([
    ...KEMONO_SERVICES,
    ...COOMER_SERVICES,
])

/**
 * returns `true` if `value` is a known {@link Service} string.
 *
 * note: this check is strict - it only accepts values present in
 * {@link KEMONO_SERVICES} or {@link COOMER_SERVICES}. if the upstream API
 * introduces a new service that has not yet been added to those lists,
 * validation will reject the response with a `PARSE_ERROR` instead of passing
 * it through. keep the service lists in sync with the API when new platforms
 * are added.
 */
export const isService = (value: unknown): value is Service =>
    typeof value === "string" && SERVICE_SET.has(value)

export const PLATFORM_BASE_URLS: Record<Platform, string> = {
    kemono: "https://kemono.cr/api",
    coomer: "https://coomer.st/api",
}
