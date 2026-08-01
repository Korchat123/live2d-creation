import {
  createAuthoringProject,
  isCharacterBibleComplete,
  landmarkNames,
  parseAuthoringProject,
  serializeAuthoringProject,
  setPartEnabled,
  setProjectLandmark,
  updateCharacterBible,
  type AcceptedConcept,
  type AuthoringProject,
  type CharacterBible,
  type LandmarkName,
  type NormalizedPoint,
  type PartId,
} from "./authoring-project.js";

const DATABASE_NAME = "open-avatar-authoring";
const STORE_NAME = "projects";
const ACTIVE_KEY = "active";

export interface ProjectStore {
  save(project: AuthoringProject): Promise<void>;
  load(): Promise<AuthoringProject | undefined>;
}

export class MemoryProjectStore implements ProjectStore {
  #contents: string | undefined;

  save(project: AuthoringProject): Promise<void> {
    this.#contents = serializeAuthoringProject(project);
    return Promise.resolve();
  }

  load(): Promise<AuthoringProject | undefined> {
    return Promise.resolve(
      this.#contents ? parseAuthoringProject(this.#contents) : undefined,
    );
  }
}

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () =>
      reject(new Error("Could not open project storage."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });

export class IndexedDbProjectStore implements ProjectStore {
  async save(project: AuthoringProject): Promise<void> {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.onerror = () =>
          reject(new Error("Could not save the authoring project."));
        transaction.oncomplete = () => resolve();
        transaction
          .objectStore(STORE_NAME)
          .put(serializeAuthoringProject(project), ACTIVE_KEY);
      });
    } finally {
      database.close();
    }
  }

  async load(): Promise<AuthoringProject | undefined> {
    const database = await openDatabase();
    try {
      const contents = await new Promise<unknown>((resolve, reject) => {
        const request = database
          .transaction(STORE_NAME, "readonly")
          .objectStore(STORE_NAME)
          .get(ACTIVE_KEY);
        request.onerror = () =>
          reject(new Error("Could not restore the authoring project."));
        request.onsuccess = () => resolve(request.result);
      });
      if (contents === undefined) return undefined;
      if (typeof contents !== "string")
        throw new Error("Stored authoring project is invalid.");
      return parseAuthoringProject(contents);
    } finally {
      database.close();
    }
  }
}

export const normalizedImagePoint = (
  box: Readonly<{ left: number; top: number; width: number; height: number }>,
  natural: Readonly<{ width: number; height: number }>,
  client: Readonly<{ x: number; y: number }>,
): NormalizedPoint | undefined => {
  if (
    box.width <= 0 ||
    box.height <= 0 ||
    natural.width <= 0 ||
    natural.height <= 0
  )
    return undefined;
  const scale = Math.min(
    box.width / natural.width,
    box.height / natural.height,
  );
  const contentWidth = natural.width * scale;
  const contentHeight = natural.height * scale;
  const left = box.left + (box.width - contentWidth) / 2;
  const top = box.top + (box.height - contentHeight) / 2;
  const x = (client.x - left) / contentWidth;
  const y = (client.y - top) / contentHeight;
  if (x < 0 || x > 1 || y < 0 || y > 1) return undefined;
  return { x, y };
};

const downloadProject = (project: AuthoringProject): void => {
  const url = URL.createObjectURL(
    new Blob([serializeAuthoringProject(project)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.projectId}.open-avatar-project.json`;
  link.click();
  URL.revokeObjectURL(url);
};

type ReviewController = {
  acceptConcept(concept: AcceptedConcept): AuthoringProject;
  restore(expectedConceptHash?: string): Promise<AuthoringProject | undefined>;
};

export const mountProjectReview = (
  host: HTMLElement,
  conceptImage: HTMLImageElement,
  store: ProjectStore = new IndexedDbProjectStore(),
): ReviewController => {
  const form = host.querySelector<HTMLFormElement>("#character-bible-form");
  const status = host.querySelector<HTMLElement>("#project-review-status");
  const landmarkStatus = host.querySelector<HTMLElement>("#landmark-status");
  const landmarkValues = host.querySelector<HTMLElement>("#landmark-values");
  const mark = host.querySelector<HTMLButtonElement>("#mark-landmarks");
  const clear = host.querySelector<HTMLButtonElement>("#clear-landmarks");
  const partPlan = host.querySelector<HTMLElement>("#project-part-plan");
  const overlay = document.querySelector<HTMLElement>("#landmark-overlay");
  const save = host.querySelector<HTMLButtonElement>("#save-authoring-project");
  const load = host.querySelector<HTMLInputElement>("#load-authoring-project");
  if (
    !form ||
    !status ||
    !landmarkStatus ||
    !landmarkValues ||
    !mark ||
    !clear ||
    !partPlan ||
    !overlay ||
    !save ||
    !load
  )
    throw new Error("Missing character-bible controls.");

  let project: AuthoringProject | undefined;
  let nextLandmark = -1;
  let saveQueue = Promise.resolve();

  const persist = (): void => {
    if (!project) return;
    sessionStorage.setItem(
      "open-avatar-authoring-project",
      serializeAuthoringProject(project),
    );
    const snapshot = project;
    saveQueue = saveQueue
      .then(() => store.save(snapshot))
      .catch((error: unknown) => {
        status.textContent =
          error instanceof Error ? error.message : "Could not save project.";
      });
  };

  const renderLandmarks = (): void => {
    overlay.replaceChildren();
    if (
      !project ||
      !conceptImage.complete ||
      conceptImage.naturalWidth <= 0 ||
      conceptImage.naturalHeight <= 0
    )
      return;
    const imageBox = conceptImage.getBoundingClientRect();
    const overlayBox = overlay.getBoundingClientRect();
    const scale = Math.min(
      imageBox.width / conceptImage.naturalWidth,
      imageBox.height / conceptImage.naturalHeight,
    );
    const width = conceptImage.naturalWidth * scale;
    const height = conceptImage.naturalHeight * scale;
    const left = imageBox.left - overlayBox.left + (imageBox.width - width) / 2;
    const top = imageBox.top - overlayBox.top + (imageBox.height - height) / 2;
    for (const name of landmarkNames) {
      const point = project.landmarks[name];
      if (!point) continue;
      const marker = document.createElement("span");
      marker.className = "landmark-marker";
      marker.title = name;
      marker.textContent = String(landmarkNames.indexOf(name) + 1);
      marker.style.left = `${left + point.x * width}px`;
      marker.style.top = `${top + point.y * height}px`;
      overlay.append(marker);
    }
  };

  const render = (): void => {
    if (!project) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    if (conceptImage.getAttribute("src") !== project.acceptedConcept.image)
      conceptImage.src = project.acceptedConcept.image;
    const fields: Array<
      keyof Omit<CharacterBible, "canvasWidth" | "canvasHeight">
    > = ["displayName", "style", "palette", "outfit", "identityNotes"];
    fields.forEach((name) => {
      const input = form.elements.namedItem(name);
      if (
        input instanceof HTMLInputElement ||
        input instanceof HTMLTextAreaElement
      )
        input.value = project!.characterBible[name];
    });
    partPlan.replaceChildren(
      ...project.partPlan.map((entry) => {
        const label = document.createElement("label");
        label.className = "part-plan-entry";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = entry.enabled;
        input.disabled = entry.required;
        input.dataset.partId = entry.id;
        const dependencyLabel = entry.dependencies.length
          ? ` — after ${entry.dependencies.join(", ")}`
          : "";
        label.append(
          input,
          ` ${entry.id}${entry.required ? " (required)" : ""}${dependencyLabel}`,
        );
        return label;
      }),
    );
    landmarkValues.replaceChildren(
      ...landmarkNames.map((name) => {
        const row = document.createElement("fieldset");
        row.className = "landmark-value";
        const legend = document.createElement("legend");
        legend.textContent = name;
        const point = project!.landmarks[name];
        for (const axis of ["x", "y"] as const) {
          const label = document.createElement("label");
          label.textContent = axis.toUpperCase();
          const input = document.createElement("input");
          input.type = "number";
          input.min = "0";
          input.max = "1";
          input.step = "0.001";
          input.dataset.landmark = name;
          input.dataset.axis = axis;
          input.value = point ? point[axis].toFixed(3) : "";
          label.append(input);
          row.append(label);
        }
        row.prepend(legend);
        return row;
      }),
    );
    const completed = landmarkNames.filter((name) => project!.landmarks[name]);
    landmarkStatus.textContent = `${completed.length}/${landmarkNames.length} landmarks marked.`;
    status.textContent = isCharacterBibleComplete(project)
      ? "Character bible complete. Ready for project review."
      : "Complete every bible field and landmark before part generation.";
    if (conceptImage.complete) renderLandmarks();
    else conceptImage.addEventListener("load", renderLandmarks, { once: true });
  };

  form.addEventListener("input", () => {
    if (!project) return;
    const data = new FormData(form);
    const field = (name: string): string => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    project = updateCharacterBible(project, {
      displayName: field("displayName"),
      style: field("style"),
      palette: field("palette"),
      outfit: field("outfit"),
      identityNotes: field("identityNotes"),
    });
    persist();
    render();
  });

  mark.addEventListener("click", () => {
    if (!project) return;
    nextLandmark = 0;
    conceptImage.classList.add("marking-landmarks");
    landmarkStatus.textContent = `Click ${landmarkNames[nextLandmark]}.`;
  });

  clear.addEventListener("click", () => {
    if (!project) return;
    for (const name of landmarkNames)
      project = setProjectLandmark(project, name, undefined);
    nextLandmark = -1;
    conceptImage.classList.remove("marking-landmarks");
    persist();
    render();
  });

  conceptImage.addEventListener("click", (event) => {
    if (!project || nextLandmark < 0) return;
    const name = landmarkNames[nextLandmark];
    if (!name) return;
    const point = normalizedImagePoint(
      conceptImage.getBoundingClientRect(),
      { width: conceptImage.naturalWidth, height: conceptImage.naturalHeight },
      { x: event.clientX, y: event.clientY },
    );
    if (!point) {
      landmarkStatus.textContent = "Click inside the visible concept image.";
      return;
    }
    project = setProjectLandmark(project, name, point);
    nextLandmark += 1;
    if (nextLandmark >= landmarkNames.length) {
      nextLandmark = -1;
      conceptImage.classList.remove("marking-landmarks");
      landmarkStatus.textContent = "All landmarks marked.";
    } else {
      landmarkStatus.textContent = `Click ${landmarkNames[nextLandmark]}.`;
    }
    persist();
    renderLandmarks();
  });

  partPlan.addEventListener("change", (event) => {
    if (!project || !(event.target instanceof HTMLInputElement)) return;
    const id = event.target.dataset.partId as PartId | undefined;
    if (!id) return;
    project = setPartEnabled(project, id, event.target.checked);
    persist();
    render();
  });

  landmarkValues.addEventListener("input", (event) => {
    if (!project || !(event.target instanceof HTMLInputElement)) return;
    const name = event.target.dataset.landmark as LandmarkName | undefined;
    if (!name || !landmarkNames.includes(name)) return;
    const inputs = landmarkValues.querySelectorAll<HTMLInputElement>(
      `[data-landmark="${name}"]`,
    );
    const values = Object.fromEntries(
      [...inputs].map((input) => [
        input.dataset.axis,
        input.value === "" ? undefined : Number(input.value),
      ]),
    ) as { x?: number; y?: number };
    if (
      values.x === undefined ||
      values.y === undefined ||
      !Number.isFinite(values.x) ||
      !Number.isFinite(values.y) ||
      values.x < 0 ||
      values.x > 1 ||
      values.y < 0 ||
      values.y > 1
    ) {
      landmarkStatus.textContent = "Landmark values must be between 0 and 1.";
      return;
    }
    project = setProjectLandmark(project, name, {
      x: values.x,
      y: values.y,
    });
    persist();
    render();
  });

  save.addEventListener("click", () => {
    if (project) downloadProject(project);
  });

  load.addEventListener("change", () => {
    const file = load.files?.[0];
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) {
      status.textContent = "The selected project exceeds the 7 MiB file limit.";
      load.value = "";
      return;
    }
    void file
      .text()
      .then((contents) => {
        project = parseAuthoringProject(contents);
        persist();
        render();
        status.textContent = "Authoring project loaded and validated.";
      })
      .catch((error: unknown) => {
        status.textContent =
          error instanceof Error ? error.message : "Could not load project.";
      })
      .finally(() => {
        load.value = "";
      });
  });

  window.addEventListener("resize", renderLandmarks);

  return {
    acceptConcept(concept) {
      project = createAuthoringProject(concept, {
        projectId: crypto.randomUUID(),
        createdAt: Date.now(),
      });
      persist();
      render();
      return project;
    },
    async restore(expectedConceptHash) {
      const restored = await store.load();
      if (
        restored &&
        expectedConceptHash !== undefined &&
        restored.acceptedConcept.provenance.artifactSha256 !==
          expectedConceptHash
      )
        return undefined;
      project = restored;
      if (project) render();
      return project;
    },
  };
};
