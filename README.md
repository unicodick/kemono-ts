# kemono-ts

TypeScript client for [Kemono](https://kemono.cr) and [Coomer](https://coomer.st).  
Fully typed, errors as values, zero dependencies, ESM only, Node.js 20+.

```sh
npm install kemono-ts
```

---

```ts
import { KemonoClient } from "kemono-ts";

const client = KemonoClient.kemono();
const result = await client.listCreators();

if (result.ok) {
    console.log(result.value); // Creator[]
} else {
    console.error(result.error.code, result.error.message);
}
```

## Errors

Every method returns a `Result<T>` - no thrown exceptions.

```ts
const result = await client.getCreatorProfile("fanbox", "12345");

if (!result.ok) {
    switch (result.error.code) {
        case "NOT_FOUND":      // 404
        case "UNAUTHORIZED":   // 401
        case "FORBIDDEN":      // 403
        case "RATE_LIMITED":   // 429
        case "HTTP_ERROR":     // any other non-2xx
        case "NETWORK_ERROR":  // fetch threw
        case "TIMEOUT":        // request exceeded timeoutMs
        case "PARSE_ERROR":    // invalid JSON or unexpected response shape
        case "INVALID_PARAMS": // bad arguments (e.g. invalid offset)
    }
}
```

Build your own results with the helpers:

```ts
import { ok, err } from "kemono-ts";

ok({ id: "1", name: "artist" });
err("NOT_FOUND", "No creator with that ID");
```

## Config

```ts
const client = KemonoClient.kemono({
    retries: 3,
    retryDelay: 1000,  // exponential back-off: retryDelay * 2^attempt
    timeoutMs: 30_000,
    baseUrl: "https://kemono.cr/api",
    fetch: globalThis.fetch, // optional custom fetch implementation
});
```

`Retry-After` is respected on 429 responses.

### Custom headers

`headers` are merged with defaults (`Accept: text/css` is kept unless overridden):

```ts
const client = KemonoClient.kemono({
    headers: {
        "Accept": "application/json", // override default when needed
        "X-My-Header": "value",
    },
});
```

## Platforms

The platform type narrows valid services at compile time:

```ts
const kemono = KemonoClient.kemono();
kemono.getCreatorPosts("onlyfans", "123"); // TS error - onlyfans is Coomer-only
```

**Kemono:** `patreon` `fanbox` `discord` `fantia` `afdian` `boosty` `gumroad` `subscribestar` `dlsite`  
**Coomer:** `onlyfans` `fansly` `candfans`

## API

**Creators**

```ts
client.listCreators()
client.getCreatorProfile(service, creatorId)
client.getCreatorPosts(service, creatorId, { tag?: string[] })
client.getAnnouncements(service, creatorId)
client.getFancards(creatorId)  // Kemono/Fanbox only
```

**Posts**

```ts
client.listPosts({ q?: string, o?: number, tag?: string[] })
client.getPost(service, creatorId, postId)          // PostDetail with .next / .prev
client.getPostRevisions(service, creatorId, postId)
client.getRandomPost()                              // PostDetail with .next / .prev
client.iteratePosts({ q?: string, tag?: string[] }) // AsyncGenerator<Result<ListPostsResponse>>
```

### `listPosts` - pagination and envelope

Returns a `ListPostsResponse` envelope:

```ts
const result = await client.listPosts({ q: "sketch", o: 150 });

if (result.ok) {
    result.value.count;       // posts on this page
    result.value.true_count;  // total posts across all pages
    result.value.posts;       // PostSummary[]
}
```

`o` must be a **non-negative multiple of 150** (`0`, `150`, `300`, …); anything else returns `INVALID_PARAMS` without a network request.

```ts
const lastOffset = Math.floor((result.value.true_count - 1) / 150) * 150;
```

`PostSummary` includes a `substring` preview but omits `content`, `embed`, `added`, and `edited`. Use `getPost()` for the full body.

### `getRandomPost`

Makes **two** sequential requests: `/v1/posts/random` for a pointer, then `/v1/{service}/user/{id}/post/{postId}` for the full `PostDetail`.

### `iteratePosts`

Async iterator over paginated `/v1/posts` responses:

```ts
for await (const pageResult of client.iteratePosts({ q: "sketch", maxPages: 3 })) {
    if (!pageResult.ok) break;
    console.log(pageResult.value.posts);
}
```
