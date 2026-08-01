import { describe, expect, it, vi } from "vitest";
import {
  ComfyGenerationProvider,
  FakeGenerationProvider,
  conceptNodeAllowlist,
  conceptTemplateId,
  createConceptPromptPlan,
  createConceptWorkflow,
  describeAvatarStyle,
  defaultApprovedCheckpoint,
  validateConceptRequest,
  validateImageArtifact,
  type ConceptCandidate,
} from "../src/generation-provider.js";

const pngBlob = (): Blob =>
  new Blob(
    [
      new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
      ]),
    ],
    { type: "image/png" },
  );

const candidate = (): ConceptCandidate => ({
  image: pngBlob(),
  provenance: {
    provider: "fake",
    templateId: conceptTemplateId,
    checkpoint: "approved.safetensors",
    seed: 7,
    artifactSha256: "0".repeat(64),
  },
});

describe("prompt generation policy", () => {
  it("selects a sole approved checkpoint but requires a choice among several", () => {
    expect(defaultApprovedCheckpoint([])).toBe("");
    expect(defaultApprovedCheckpoint(["animagine.safetensors"])).toBe(
      "animagine.safetensors",
    );
    expect(
      defaultApprovedCheckpoint(["first.safetensors", "second.safetensors"]),
    ).toBe("");
  });

  it("keeps the reviewed workflow inside the node allowlist and fixed budgets", () => {
    const workflow = createConceptWorkflow({
      prompt: "blue-haired librarian",
      checkpoint: "approved.safetensors",
      seed: 7,
    });
    expect(
      Object.values(workflow).every((node) =>
        conceptNodeAllowlist.includes(node.class_type),
      ),
    ).toBe(true);
    expect(workflow["1"]?.inputs.ckpt_name).toBe("approved.safetensors");
    expect(workflow["4"]?.inputs).toEqual({
      width: 768,
      height: 1024,
      batch_size: 1,
    });
    expect(workflow["5"]?.inputs.steps).toBe(20);
    expect(workflow["7"]?.inputs.filename_prefix).toBe("open-avatar-concept");
  });

  it("plans an Animagine tag request deterministically with model settings", () => {
    const request = {
      prompt: "  blue-haired woman   with a navy jacket ",
      checkpoint: "animagine-xl-4.0-opt.safetensors",
      seed: 7,
    };
    const plan = createConceptPromptPlan(request.prompt, request.checkpoint);
    expect(plan).toMatchObject({
      profile: "animagine-xl-4",
      identity: "blue-haired woman with a navy jacket",
      quality: "masterpiece, high score, great score, absurdres",
    });
    expect(plan.positive).toContain("1girl, adult original character, solo");
    expect(plan.style).toContain("VTuber model art");
    expect(plan.palette).toContain("natural consistent skin tone");
    expect(plan.pose).toContain("margin above hair");
    expect(plan.pose).toContain("complete shoes");
    expect(plan.pose).toContain("75 percent");
    expect(plan.pose).toContain("proportionate wearable headwear");
    expect(plan.pose).toContain("face fully visible and evenly lit");
    expect(plan.pose).toContain("headwear do not cover the eyes or face");
    expect(plan.pose).toContain("arms slightly separated from the torso");
    expect(plan.pose).toContain("prop does not cross the face");
    expect(plan.pose).toContain("5 to 10 percent safe margin");
    expect(plan.negative).toContain("giant hat");
    expect(plan.negative).toContain("hat covering face");
    expect(plan.negative).toContain("prop crossing torso");
    expect(plan.negative).toContain("multiple people");
    expect(plan.negative).toContain("unnatural skin color");
    expect(plan.negative).toContain("close-up");
    const workflow = createConceptWorkflow(request);
    expect(workflow["2"]?.inputs.text).toBe(plan.positive);
    expect(workflow["3"]?.inputs.text).toBe(plan.negative);
    expect(workflow["4"]?.inputs).toEqual({
      width: 896,
      height: 1152,
      batch_size: 1,
    });
    expect(workflow["5"]?.inputs).toMatchObject({
      steps: 28,
      cfg: 5,
      sampler_name: "euler_ancestral",
    });
    const controlled = createConceptWorkflow(request, {
      controlNet: "pose.safetensors",
      image: "open-avatar-openpose-v1.png",
    });
    expect(controlled["8"]).toMatchObject({
      class_type: "LoadImage",
      inputs: { image: "open-avatar-openpose-v1.png" },
    });
    expect(controlled["9"]).toMatchObject({
      class_type: "ControlNetLoader",
      inputs: { control_net_name: "pose.safetensors" },
    });
    expect(controlled["10"]?.class_type).toBe("ControlNetApplyAdvanced");
    expect(controlled["10"]?.inputs).toMatchObject({
      strength: 0.75,
      start_percent: 0,
      end_percent: 0.75,
    });
    expect(controlled["5"]?.inputs).toMatchObject({
      positive: ["10", 0],
      negative: ["10", 1],
    });
  });

  it("applies bounded anime style presets and persists their art direction", () => {
    const plan = createConceptPromptPlan(
      "adult librarian in a navy jacket",
      "animagine-xl-4.0-opt.safetensors",
      "anime",
    );
    expect(plan.style).toContain("Japanese TV anime character design");
    expect(plan.positive).toContain("two-tone cel shading");
    expect(describeAvatarStyle(" adult librarian ", "soft-anime")).toContain(
      "soft modern anime illustration",
    );
  });

  it("rejects blank, excessive, unapproved, and invalid-seed requests", () => {
    const approved = new Set(["approved.safetensors"]);
    expect(() =>
      validateConceptRequest(
        { prompt: " ", checkpoint: "approved.safetensors", seed: 1 },
        approved,
      ),
    ).toThrow("Describe");
    expect(() =>
      validateConceptRequest(
        {
          prompt: "x".repeat(16 * 1024 + 1),
          checkpoint: "approved.safetensors",
          seed: 1,
        },
        approved,
      ),
    ).toThrow("16 KiB");
    expect(() =>
      validateConceptRequest(
        { prompt: "avatar", checkpoint: "other.safetensors", seed: 1 },
        approved,
      ),
    ).toThrow("approved");
    expect(() =>
      validateConceptRequest(
        { prompt: "avatar", checkpoint: "approved.safetensors", seed: -1 },
        approved,
      ),
    ).toThrow("32-bit");
    expect(() =>
      validateConceptRequest(
        {
          prompt: "avatar",
          checkpoint: "approved.safetensors",
          seed: 1,
          style: "oil-paint" as never,
        },
        approved,
      ),
    ).toThrow("supported avatar art style");
  });

  it("validates signature, MIME, dimensions, bytes, and alpha", async () => {
    await expect(
      validateImageArtifact(pngBlob(), async () => ({
        width: 768,
        height: 768,
        hasAlpha: true,
      })),
    ).resolves.toEqual({ width: 768, height: 768, hasAlpha: true });
    await expect(
      validateImageArtifact(
        new Blob(["not an image"], { type: "image/png" }),
        async () => ({ width: 1, height: 1, hasAlpha: true }),
      ),
    ).rejects.toThrow("supported PNG or WebP");
    await expect(
      validateImageArtifact(pngBlob(), async () => ({
        width: 2048,
        height: 768,
        hasAlpha: true,
      })),
    ).rejects.toThrow("1152-pixel");
    await expect(
      validateImageArtifact(
        pngBlob(),
        async () => ({ width: 8, height: 8, hasAlpha: false }),
        true,
      ),
    ).rejects.toThrow("transparent");
  });

  it("uses a deterministic fake in CI without accepting unapproved checkpoints", async () => {
    const provider = new FakeGenerationProvider(candidate(), [
      "approved.safetensors",
    ]);
    await expect(provider.health()).resolves.toMatchObject({ state: "ready" });
    await expect(
      provider.generate(
        {
          prompt: "blue-haired librarian",
          checkpoint: "approved.safetensors",
          seed: 7,
        },
        { signal: new AbortController().signal },
      ),
    ).resolves.toEqual(candidate());
  });
});

describe("ComfyUI adapter", () => {
  it("invokes the fetch adapter with the browser global receiver", async () => {
    const receivers: unknown[] = [];
    const fetcher: typeof fetch = function (this: unknown, input) {
      receivers.push(this);
      const url = String(input);
      return Promise.resolve(
        url === "/comfy/models/checkpoints"
          ? new Response(JSON.stringify(["approved.safetensors"]))
          : new Response("{}"),
      );
    };
    const provider = new ComfyGenerationProvider(
      ["approved.safetensors"],
      fetcher,
    );

    await expect(provider.health()).resolves.toMatchObject({ state: "ready" });
    expect(receivers).toEqual([globalThis, globalThis]);
  });

  it("reports missing allowlist configuration without network access", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = new ComfyGenerationProvider([], fetcher);
    await expect(provider.health()).resolves.toMatchObject({
      state: "misconfigured",
      approvedCheckpoints: [],
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("intersects installed checkpoints with the host allowlist", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}"))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify(["unverified.safetensors", "approved.safetensors"]),
        ),
      );
    const provider = new ComfyGenerationProvider(
      ["approved.safetensors"],
      fetcher,
    );
    await expect(provider.health()).resolves.toMatchObject({
      state: "ready",
      approvedCheckpoints: ["approved.safetensors"],
    });
  });

  it("requires an allowlisted composition model when configured", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("{}"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(["approved.safetensors"])),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(["pose.safetensors"])),
      );
    const provider = new ComfyGenerationProvider(
      ["approved.safetensors"],
      fetcher,
      async () => undefined,
      ["pose.safetensors"],
    );
    await expect(provider.health()).resolves.toMatchObject({
      state: "ready",
      approvedControlNets: ["pose.safetensors"],
    });
  });

  it("submits one reviewed workflow and returns one hashed candidate", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url === "/comfy/prompt")
        return new Response(JSON.stringify({ prompt_id: "job-1" }));
      if (url === "/comfy/history/job-1")
        return new Response(
          JSON.stringify({
            "job-1": {
              outputs: {
                "7": {
                  images: [
                    {
                      filename: "concept.png",
                      subfolder: "",
                      type: "output",
                    },
                  ],
                },
              },
            },
          }),
        );
      if (url.startsWith("/comfy/view?")) return new Response(pngBlob());
      throw new Error(`Unexpected request: ${url}`);
    });
    const provider = new ComfyGenerationProvider(
      ["approved.safetensors"],
      fetcher,
      async () => undefined,
    );
    const result = await provider.generate(
      {
        prompt: "blue-haired librarian",
        checkpoint: "approved.safetensors",
        seed: 7,
      },
      { signal: new AbortController().signal },
    );
    expect(result.image.type).toBe("image/png");
    expect(result.provenance).toMatchObject({
      provider: "comfyui",
      templateId: conceptTemplateId,
      checkpoint: "approved.safetensors",
      seed: 7,
    });
    expect(result.provenance.artifactSha256).toMatch(/^[a-f0-9]{64}$/u);
    const submission = fetcher.mock.calls.find(
      ([input]) => String(input) === "/comfy/prompt",
    );
    const body = JSON.parse(String(submission?.[1]?.body)) as {
      prompt: Record<string, { class_type: string }>;
    };
    expect(
      Object.values(body.prompt).every((node) =>
        conceptNodeAllowlist.includes(
          node.class_type as (typeof conceptNodeAllowlist)[number],
        ),
      ),
    ).toBe(true);
  });

  it("uploads and records the application-owned composition control", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url === "/comfy/upload/image")
        return new Response(
          JSON.stringify({
            name: "open-avatar-openpose-v2.png",
            subfolder: "",
            type: "input",
          }),
        );
      if (url === "/comfy/prompt")
        return new Response(JSON.stringify({ prompt_id: "controlled-job" }));
      if (url === "/comfy/history/controlled-job")
        return new Response(
          JSON.stringify({
            "controlled-job": {
              outputs: {
                "7": {
                  images: [
                    {
                      filename: "controlled.png",
                      subfolder: "",
                      type: "output",
                    },
                  ],
                },
              },
            },
          }),
        );
      if (url.startsWith("/comfy/view?")) return new Response(pngBlob());
      throw new Error(`Unexpected request: ${url}`);
    });
    const provider = new ComfyGenerationProvider(
      ["approved.safetensors"],
      fetcher,
      async () => undefined,
      ["pose.safetensors"],
      async () => pngBlob(),
    );
    const result = await provider.generate(
      {
        prompt: "blue-haired librarian",
        checkpoint: "approved.safetensors",
        seed: 7,
      },
      { signal: new AbortController().signal },
    );
    expect(result.provenance.compositionControl).toEqual({
      templateId: "open-avatar-openpose-v2",
      controlNet: "pose.safetensors",
    });
    const submission = fetcher.mock.calls.find(
      ([input]) => String(input) === "/comfy/prompt",
    );
    const body = JSON.parse(String(submission?.[1]?.body)) as {
      prompt: Record<string, { class_type: string }>;
    };
    expect(body.prompt["10"]?.class_type).toBe("ControlNetApplyAdvanced");
  });

  it("cancels the provider when the caller aborts an active job", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      if (url === "/comfy/prompt") {
        controller.abort();
        return new Response(JSON.stringify({ prompt_id: "job-1" }));
      }
      if (url === "/comfy/interrupt" || url === "/comfy/queue")
        return new Response("{}");
      throw new Error(`Unexpected request: ${url} ${String(init?.method)}`);
    });
    const provider = new ComfyGenerationProvider(
      ["approved.safetensors"],
      fetcher,
      async (_milliseconds, signal) => {
        if (signal.aborted)
          throw new DOMException("Generation cancelled.", "AbortError");
      },
    );
    await expect(
      provider.generate(
        {
          prompt: "blue-haired librarian",
          checkpoint: "approved.safetensors",
          seed: 7,
        },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith("/comfy/interrupt", {
        method: "POST",
      });
    });
  });
});
