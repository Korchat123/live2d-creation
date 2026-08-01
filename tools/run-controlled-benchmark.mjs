#!/usr/bin/env node

const endpoint = "http://127.0.0.1:8188";
const checkpoint = "animagine-xl-4.0-opt.safetensors";
const controlNet = "xinsir-controlnet-openpose-sdxl-1.0.safetensors";
const controlImage = "open-avatar-openpose-v1.png";
const seeds = process.argv
  .find((argument) => argument.startsWith("--seeds="))
  ?.slice("--seeds=".length)
  .split(",")
  .map(Number) ?? [7, 101, 2027, 65537];

if (
  seeds.length === 0 ||
  seeds.some(
    (seed) => !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff,
  )
)
  throw new Error("--seeds must contain comma-separated 32-bit integers.");

const cases = [
  "1girl, adult woman librarian, cobalt blue long wavy hair, round glasses, emerald green eyes, cream cardigan, navy pleated skirt, red ribbon tie",
  "1boy, adult man astronomer, short silver hair, blue eyes, dark navy uniform, gold star embroidery, high collar",
  "1other, androgynous courier, auburn short layered hair, hazel eyes, moss green cloak, tan tunic, leather satchel strap",
  "1girl, adult woman mechanic, black hair in a long side braid, bright orange hair streak, amber eyes, teal coveralls, white undershirt",
  "1boy, adult man magician, swept violet hair, golden eyes, burgundy vest, white shirt, black bow tie, dark cape",
];

const negative =
  "lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, close-up, extreme close-up, head out of frame, hair out of frame, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry, multiple people, duplicate face, side view, border, frame, halo, sunburst, rays, background object, colored background, gradient background, abstract background, scenery";

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const workflow = (description, seed, prefix) => ({
  1: {
    class_type: "CheckpointLoaderSimple",
    inputs: { ckpt_name: checkpoint },
  },
  2: {
    class_type: "CLIPTextEncode",
    inputs: {
      text: `original character, solo, anime style, clean line art, ${description}, clothing and accessories exactly as described, consistent color palette, looking at viewer, front view, full body, standing, zoomed out, centered composition, neutral pose, head fully inside frame, complete head, complete hair, generous margin above hair, visible neck, visible shoulders, isolated on a blank pure white background, no props, masterpiece, high score, great score, absurdres`,
      clip: ["1", 1],
    },
  },
  3: {
    class_type: "CLIPTextEncode",
    inputs: { text: negative, clip: ["1", 1] },
  },
  4: {
    class_type: "EmptyLatentImage",
    inputs: { width: 1024, height: 1024, batch_size: 1 },
  },
  5: {
    class_type: "KSampler",
    inputs: {
      seed,
      steps: 28,
      cfg: 5,
      sampler_name: "euler_ancestral",
      scheduler: "normal",
      denoise: 1,
      model: ["1", 0],
      positive: ["10", 0],
      negative: ["10", 1],
      latent_image: ["4", 0],
    },
  },
  6: {
    class_type: "VAEDecode",
    inputs: { samples: ["5", 0], vae: ["1", 2] },
  },
  7: {
    class_type: "SaveImage",
    inputs: { filename_prefix: prefix, images: ["6", 0] },
  },
  8: { class_type: "LoadImage", inputs: { image: controlImage } },
  9: {
    class_type: "ControlNetLoader",
    inputs: { control_net_name: controlNet },
  },
  10: {
    class_type: "ControlNetApplyAdvanced",
    inputs: {
      positive: ["2", 0],
      negative: ["3", 0],
      control_net: ["9", 0],
      image: ["8", 0],
      strength: 0.75,
      start_percent: 0,
      end_percent: 0.75,
      vae: ["1", 2],
    },
  },
});

const requestJson = async (path, options) => {
  const response = await fetch(`${endpoint}${path}`, options);
  if (!response.ok)
    throw new Error(`${path} returned HTTP ${response.status}.`);
  return response.json();
};

const waitForResult = async (promptId) => {
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await sleep(1000);
    const history = await requestJson(
      `/history/${encodeURIComponent(promptId)}`,
    );
    const job = history[promptId];
    const image = Object.values(job?.outputs ?? {}).flatMap(
      (output) => output.images ?? [],
    )[0];
    if (image) return image;
    const messages = job?.status?.messages ?? [];
    if (messages.some((message) => message?.[0] === "execution_error"))
      throw new Error("ComfyUI reported an execution error.");
  }
  throw new Error("ComfyUI did not complete within four minutes.");
};

const results = [];
for (const seed of seeds) {
  for (const [index, description] of cases.entries()) {
    const caseNumber = index + 1;
    const prefix = `open-avatar-controlled-suite-v2/p${String(caseNumber).padStart(2, "0")}-s${String(seed).padStart(10, "0")}`;
    const startedAt = Date.now();
    try {
      const queued = await requestJson("/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "open-avatar-controlled-benchmark",
          prompt: workflow(description, seed, prefix),
        }),
      });
      if (typeof queued.prompt_id !== "string")
        throw new Error("ComfyUI returned no prompt id.");
      const image = await waitForResult(queued.prompt_id);
      results.push({
        case: caseNumber,
        seed,
        state: "complete",
        seconds: (Date.now() - startedAt) / 1000,
        image,
      });
    } catch (error) {
      results.push({
        case: caseNumber,
        seed,
        state: "error",
        seconds: (Date.now() - startedAt) / 1000,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    process.stdout.write(`${JSON.stringify(results.at(-1))}\n`);
  }
}

const complete = results.filter(({ state }) => state === "complete");
process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    complete: complete.length,
    errors: results.length - complete.length,
    averageSeconds:
      complete.reduce((total, item) => total + item.seconds, 0) /
        complete.length || null,
    maximumSeconds: Math.max(...complete.map(({ seconds }) => seconds), 0),
  })}\n`,
);
