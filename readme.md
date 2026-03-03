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
        case "NOT_FOUND":     // 404
        case "RATE_LIMITED":  // 429
        case "HTTP_ERROR":    // any other non-2xx
        case "NETWORK_ERROR": // fetch threw
        case "PARSE_ERROR":   // invalid JSON
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
});
```

`Retry-After` is respected on 429 responses.

## Platforms

The platform type narrows valid services at compile time:

```ts
const kemono = KemonoClient.kemono();
kemono.getCreatorPosts("onlyfans", "123"); // TS error — onlyfans is Coomer-only
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
client.getRandomPost()
```
