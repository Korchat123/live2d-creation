# AI controller example

An AI host never receives raw avatar parameter names. It translates a small,
host-reviewed cue into the shared control protocol; the trusted host still
supplies `{ source: "ai" }` when it calls `AvatarRuntime.submit`.

```ts
import { createSemanticController } from "@open-avatar/web-component";

const ai = createSemanticController(
  { submit: (command) => runtime.submit(command, { source: "ai" }) },
  { expressions: ["happy", "thinking"], motions: ["wave", "explain"] },
);

ai.send({ type: "expression", id: "happy" });
ai.send({ type: "gaze", x: 0.25, y: -0.1 });
```

Unapproved expression and motion IDs are rejected locally and never submitted.
The host owns prompts, provider events, credentials, and remote-control policy.
