# Framework-neutral embedding

The runtime is a normal TypeScript object; a framework only owns its element,
canvas, and cleanup. Bind the runtime in your framework lifecycle and send the
same semantic envelopes used by Studio and automated controllers.

```ts
const runtime = createAvatarRuntimeForCanvas(canvas);
await runtime.load(manifest);

const result = runtime.submit(command, { source: "human" });
runtime.tick();

// Framework unmount hook:
runtime.dispose();
```

For custom-element hosts, registration is explicit and import-safe for SSR:

```ts
import { defineOpenAvatarElement } from "@open-avatar/web-component";

defineOpenAvatarElement();
// <open-avatar></open-avatar>
```

Set the element's `controller` to a trusted host bridge and dispatch an
`open-avatar-command` event whose `detail` is a protocol envelope. Results are
emitted as `open-avatar-command-result`. If the bridge reports runtime
`fallback`, the element replaces its content with an accessible status message.
