import { vi } from "vitest"

export type MockResponseInit = {
    status?: number,
    body?: unknown,
    rawBody?: string,
    headers?: Record<string, string>,
}

const buildMockResponse = (init: MockResponseInit): Response => {
    const { status = 200, body, rawBody, headers = {} } = init

    const responseText
        = rawBody !== undefined ? rawBody : JSON.stringify(body)

    const jsonFn
        = body !== undefined && rawBody === undefined
            ? () => Promise.resolve(body)
            : () => Promise.reject(new SyntaxError("Unexpected token"))

    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
        json: jsonFn,
        text: () => Promise.resolve(responseText),
    } as unknown as Response
}

export const mockFetch = (init: MockResponseInit) =>
    vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(buildMockResponse(init))

export const mockFetchError = (error: Error) =>
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(error)

export const mockFetchSequence = (inits: MockResponseInit[]) => {
    const spy = vi.spyOn(globalThis, "fetch")
    for (const init of inits) {
        spy.mockResolvedValueOnce(buildMockResponse(init))
    }
    return spy
}
