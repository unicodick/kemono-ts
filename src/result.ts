export type KemonoErrorCode
    = | "HTTP_ERROR"
        | "NETWORK_ERROR"
        | "TIMEOUT"
        | "PARSE_ERROR"
        | "NOT_FOUND"
        | "UNAUTHORIZED"
        | "FORBIDDEN"
        | "RATE_LIMITED"
        | "INVALID_PARAMS"

export type KemonoError = {
    code: KemonoErrorCode,
    message: string,
    status?: number,
}

export type Result<T>
    = | { ok: true, value: T }
        | { ok: false, error: KemonoError }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })

export const err = (
    code: KemonoErrorCode,
    message: string,
    status?: number,
): Result<never> => ({
    ok: false,
    error: { code, message, status },
})
