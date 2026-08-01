import { describe, expect, it, vi } from "vitest";
import {
  ComfyGenerationProvider,
  FakeGenerationProvider,
  conceptNodeAllowlist,
  conceptTemplateId,
  createConceptPromptPlan,
  createConceptWorkflow,
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
      height: 768,
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
    expect(plan.positive).toContain("1girl, original character, solo");
    expect(plan.pose).toContain("margin above hair");
    expect(plan.negative).toContain("multiple people");
    expect(plan.negative).toContain("close-up");
    const workflow = createConceptWorkflow(request);
    expect(workflow["2"]?.inputs.text).toBe(plan.positive);
    expect(workflow["3"]?.inputs.text).toBe(plan.negative);
    expect(workflow["4"]?.inputs).toEqual({
      width: 1024,
      height: 1024,
      batch_size: 1,
    });
    expect(workflow["5"]?.inputs).toMatchObject({
      steps: 28,
      cfg: 5,
      sampler_name: "euler_ancestral",
    });
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
    ).rejects.toThrow("1024-pixel");
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
