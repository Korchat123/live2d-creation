import type { ExportedProject } from "./authoring.js";
import {
  buildStarterAvatarProject,
  catalogColor,
  missingCatalogKinds,
  starterAvatarCatalog,
} from "./avatar-kit-catalog.js";
import {
  planAvatarKit,
  type AvatarKitPlan,
  type AvatarSetKind,
  type PlannedAvatarSet,
} from "./avatar-kit-planner.js";

export type AvatarKitWorkspace = Readonly<{
  rebuild(): Promise<ExportedProject>;
  currentPlan(): AvatarKitPlan;
}>;

const labels: Readonly<Record<AvatarSetKind, string>> = {
  body: "Body type",
  face: "Face shape",
  eyes: "Eye shape",
  mouth: "Mouth shape",
  hair: "Hairstyle",
  outfit: "Outfit",
  "animal-ears": "Animal ears",
  tail: "Tail",
  headwear: "Headwear",
  prop: "Held prop",
  accessory: "Accessory",
};

const replaceSet = (
  plan: AvatarKitPlan,
  kind: AvatarSetKind,
  update: Partial<PlannedAvatarSet>,
): AvatarKitPlan => ({
  ...plan,
  sets: plan.sets.map((set) =>
    set.kind === kind ? { ...set, ...update } : set,
  ),
});

export const mountAvatarKitWorkspace = (
  promptWorkspace: HTMLElement,
  onProject: (project: ExportedProject) => Promise<void>,
  onGenerateMissing?: (
    project: ExportedProject,
    plan: AvatarKitPlan,
  ) => Promise<ExportedProject>,
): AvatarKitWorkspace => {
  const prompt =
    promptWorkspace.querySelector<HTMLTextAreaElement>("#character-prompt");
  const style =
    promptWorkspace.querySelector<HTMLSelectElement>("#avatar-style");
  if (!prompt || !style) throw new Error("Missing avatar-kit prompt controls.");
  const section = document.createElement("section");
  section.className = "avatar-kit-workspace";
  section.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">Fast default</p><h2>Assemble from saved avatar parts</h2><p>Studio selects anatomy-compatible saved shapes, recolors declared channels, and uses ComfyUI only for a missing set.</p></div><span id="avatar-kit-state" class="status">Ready</span></div>
    <div class="avatar-kit-grid">
      <div><div id="avatar-kit-sets" class="avatar-kit-sets"></div><label>Reproducible selection seed<input id="avatar-kit-seed" type="number" min="0" max="4294967295" value="1"></label><div class="buttons"><button id="plan-avatar-kit" type="button">Choose saved parts</button><button id="shuffle-avatar-kit" type="button" class="quiet">Shuffle compatible shapes</button><button id="generate-avatar-kit-misses" type="button" class="quiet" disabled>Generate missing sets</button></div><p id="avatar-kit-status" class="note" aria-live="polite">Enter a prompt, then choose saved parts. No reference generation is required.</p></div>
      <figure class="avatar-kit-preview"><img id="avatar-kit-preview" alt="Assembled saved-part avatar preview" hidden><figcaption>Full-canvas registered parts using the standard front anatomy profile.</figcaption><div class="buttons"><button id="use-avatar-kit" type="button" disabled>Use this avatar</button></div></figure>
    </div>`;
  promptWorkspace.after(section);
  const setList = section.querySelector<HTMLElement>("#avatar-kit-sets")!;
  const seedInput =
    section.querySelector<HTMLInputElement>("#avatar-kit-seed")!;
  const choose = section.querySelector<HTMLButtonElement>("#plan-avatar-kit")!;
  const shuffle = section.querySelector<HTMLButtonElement>(
    "#shuffle-avatar-kit",
  )!;
  const use = section.querySelector<HTMLButtonElement>("#use-avatar-kit")!;
  const generateMissing = section.querySelector<HTMLButtonElement>(
    "#generate-avatar-kit-misses",
  )!;
  const preview = section.querySelector<HTMLImageElement>(
    "#avatar-kit-preview",
  )!;
  const status = section.querySelector<HTMLElement>("#avatar-kit-status")!;
  const state = section.querySelector<HTMLElement>("#avatar-kit-state")!;
  let plan = planAvatarKit("", 1, starterAvatarCatalog, style.value);
  let project: ExportedProject | undefined;

  const renderControls = (): void => {
    setList.replaceChildren();
    plan.sets.forEach((set) => {
      const row = document.createElement("article");
      row.className = "avatar-kit-set";
      const heading = document.createElement("h3");
      heading.textContent = labels[set.kind];
      const select = document.createElement("select");
      select.setAttribute("aria-label", `${labels[set.kind]} saved shape`);
      const candidates = starterAvatarCatalog.filter(
        (entry) =>
          entry.kind === set.kind &&
          (entry.anchorProfile === plan.anchorProfile ||
            entry.compatibleAnchorProfiles.includes(plan.anchorProfile)),
      );
      candidates.forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry.id;
        option.textContent = entry.label;
        option.selected = entry.id === set.catalogEntryId;
        select.append(option);
      });
      const generate = document.createElement("option");
      generate.value = "__generate__";
      generate.textContent = "Generate a new compatible set…";
      generate.selected = set.source === "generate";
      select.append(generate);
      select.addEventListener("change", () => {
        plan = {
          ...plan,
          sets: plan.sets.map((current) => {
            if (current.kind !== set.kind) return current;
            const {
              catalogEntryId: _catalog,
              generationPrompt: _prompt,
              ...base
            } = current;
            void _catalog;
            void _prompt;
            return select.value === "__generate__"
              ? {
                  ...base,
                  source: "generate" as const,
                  generationPrompt: `Create only one ${set.kind} avatar set for ${prompt.value.trim()}, fit anatomy anchor profile ${plan.anchorProfile}, full-canvas aligned RGBA, no complete character.`,
                }
              : {
                  ...base,
                  source: "catalog" as const,
                  catalogEntryId: select.value,
                };
          }),
        };
        project = undefined;
        use.disabled = true;
        generateMissing.disabled =
          !onGenerateMissing || missingCatalogKinds(plan).length === 0;
        status.textContent = "Selection changed. Assemble again to review it.";
      });
      row.append(heading, select);
      const channel =
        set.kind === "eyes"
          ? "iris"
          : set.kind === "hair"
            ? "hair"
            : set.kind === "outfit"
              ? "fabric"
              : undefined;
      if (channel) {
        const colorLabel = document.createElement("label");
        colorLabel.textContent = `${channel[0]!.toUpperCase()}${channel.slice(1)} color`;
        const color = document.createElement("input");
        color.type = "color";
        color.value = catalogColor(
          set.colorOverrides[channel],
          channel === "iris"
            ? "#45a3cf"
            : channel === "hair"
              ? "#25355d"
              : "#405b91",
        );
        color.addEventListener("input", () => {
          plan = replaceSet(plan, set.kind, {
            colorOverrides: { ...set.colorOverrides, [channel]: color.value },
          });
          project = undefined;
          use.disabled = true;
          status.textContent = "Color changed. Assemble again to review it.";
        });
        colorLabel.append(color);
        row.append(colorLabel);
      }
      setList.append(row);
    });
  };

  const createPlan = (): void => {
    const seed = Number(seedInput.value) >>> 0;
    plan = planAvatarKit(prompt.value, seed, starterAvatarCatalog, style.value);
    project = undefined;
    use.disabled = true;
    renderControls();
    const missing = missingCatalogKinds(plan);
    generateMissing.disabled = !onGenerateMissing || missing.length === 0;
    status.textContent = missing.length
      ? `Saved parts selected. ComfyUI is needed only for: ${missing.join(", ")}. A compatible fallback can be previewed first.`
      : "Every requested set is available locally. Assemble without ComfyUI.";
  };

  const renderProjectPreview = async (next: ExportedProject): Promise<void> => {
    const composite = document.createElement("canvas");
    composite.width = 896;
    composite.height = 1152;
    const context = composite.getContext("2d");
    if (!context) throw new Error("Could not preview the saved avatar kit.");
    const ordered = [
      "back hair",
      "accessory",
      "left leg",
      "right leg",
      "left footwear",
      "right footwear",
      "torso",
      "left arm and hand",
      "right arm and hand",
      "neck",
      "face base",
      "left eye white",
      "right eye white",
      "left pupil iris",
      "right pupil iris",
      "left eye highlight",
      "right eye highlight",
      "left upper eyelid",
      "right upper eyelid",
      "left lower eyelid",
      "right lower eyelid",
      "left eyebrow",
      "right eyebrow",
      "mouth closed lips",
      "outfit front",
      "front hair",
      "headwear",
    ];
    for (const name of ordered) {
      const source = next.generatedArtwork[name];
      if (!source) continue;
      await new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => {
          context.drawImage(image, 0, 0);
          resolve();
        };
        image.onerror = () => resolve();
        image.src = source;
      });
    }
    preview.src = composite.toDataURL("image/png");
    preview.hidden = false;
  };

  const rebuild = async (): Promise<ExportedProject> => {
    choose.disabled = true;
    shuffle.disabled = true;
    use.disabled = true;
    state.textContent = "Assembling";
    try {
      project = await buildStarterAvatarProject(plan);
      await renderProjectPreview(project);
      use.disabled = false;
      state.textContent = "Ready";
      status.textContent = missingCatalogKinds(plan).length
        ? "Preview uses compatible saved fallbacks for missing requested sets. Generate those sets before production export."
        : "Saved avatar assembled. Review it, adjust any set, or continue to Motion Lab.";
      return project;
    } finally {
      choose.disabled = false;
      shuffle.disabled = false;
    }
  };

  choose.addEventListener("click", () => {
    createPlan();
    void rebuild();
  });
  shuffle.addEventListener("click", () => {
    seedInput.value = String((Number(seedInput.value) + 1) >>> 0);
    createPlan();
    void rebuild();
  });
  generateMissing.addEventListener("click", () => {
    if (!onGenerateMissing) return;
    generateMissing.disabled = true;
    choose.disabled = true;
    shuffle.disabled = true;
    use.disabled = true;
    state.textContent = "Generating";
    status.textContent =
      "ComfyUI is generating only the missing set inside its registered mask…";
    void (project ? Promise.resolve(project) : buildStarterAvatarProject(plan))
      .then((baseline) => onGenerateMissing(baseline, plan))
      .then(async (generated) => {
        project = generated;
        await renderProjectPreview(generated);
        use.disabled = false;
        state.textContent = "Review candidate";
        status.textContent =
          "Generated set candidate is shown in context. Use this avatar to accept it only for this project.";
      })
      .catch((error: unknown) => {
        state.textContent = "Generation failed";
        status.textContent =
          error instanceof Error
            ? error.message
            : "Could not generate the missing set.";
      })
      .finally(() => {
        choose.disabled = false;
        shuffle.disabled = false;
        generateMissing.disabled = false;
      });
  });
  style.addEventListener("change", () => {
    createPlan();
  });
  use.addEventListener("click", () => {
    if (!project) return;
    use.disabled = true;
    state.textContent = "Saving";
    void onProject(project)
      .then(() => {
        state.textContent = "Saved";
        status.textContent =
          "Avatar project saved. Open Motion Lab below when you are ready.";
      })
      .catch((error: unknown) => {
        use.disabled = false;
        state.textContent = "Failed";
        status.textContent =
          error instanceof Error
            ? error.message
            : "Could not save the avatar kit.";
      });
  });
  renderControls();
  return { rebuild, currentPlan: () => plan };
};
