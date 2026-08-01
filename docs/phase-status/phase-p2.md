# Phase P2 status

Status: accepted  
Reviewed: 2026-08-01

## Implemented evidence

- A generated concept remains a temporary candidate until the user activates
  **Accept design**.
- Studio retains up to four bounded candidates for side-by-side thumbnail
  comparison. Candidate selection does not mutate a project.
- Acceptance embeds the bounded PNG/WebP, dimensions, prompt, checkpoint, seed,
  template ID, and artifact hash into a new private revision-1 project.
- The private app-local project records a 2048 by 2048 character-bible canvas,
  editable identity fields, normalized landmarks, a stable bounded part plan,
  explicit dependencies, and export-blocking rights state.
- Project creation is deterministic when supplied the same concept, project ID,
  and creation time.
- Save/load validation rejects external concept URLs, oversized embedded images,
  invalid dimensions or provenance, unknown versions, and invalid structure.
- Accepted project data is stored in browser session storage and is not yet a
  public bundle or package contract.
- IndexedDB preserves the validated active project across browser restarts.
- A bounded deterministic JSON file supports explicit project save/load.
- Landmark review supports concept-image clicks and keyboard-accessible
  normalized X/Y fields.
- Required parts cannot be disabled. Optional parts can be enabled only inside
  the reviewed inventory, and loaded dependencies must match the v1 graph.
- A Chromium clean-session test accepts a concept, fills the bible and all six
  landmarks, enables an optional part, reloads, and verifies exact restoration.

## Gate decision

P2 is accepted. The private v1 project boundary is frozen for the P3 spike. It
remains app-private and may change through an explicit migration before any
public format proposal.

No accepted concept from the physical P1 smoke test entered a project; that
candidate failed creative review.

The next gate is the production-model benchmark in `roadmap.md`. P3 part
generation must not begin until the model-quality and local-hardware thresholds
pass or an explicitly approved provider alternative is selected.
