# Phase A capability acceptance checklist

Use this checklist for the reference avatar and every conformance fixture. Each
row traces to one normative requirement in
`docs/protocol/capabilities.md`. Record evidence as a test report, screenshot,
sample log, or review link; unchecked prose is not evidence.

| Requirement | Authoring evidence and observable acceptance test                                                                                                                                                                         | Gate                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| CAP-EXP-001 | List expression identifiers, target semantics, affected channels, blend duration, and tolerance. Sample neutral-to-expression and expression-to-expression transitions; verify the target and absence of channel leakage. | Phase B automated pose samples plus Phase A expression-sheet review |
| CAP-MOT-001 | List motion identifiers, duration/loop policy, affected channels, and terminal pose. Replay twice with the same seed and fake clock; sampled poses and one terminal result must match.                                    | Phase B deterministic test                                          |
| CAP-GAZ-001 | Declare gaze limits and follow behavior. Capture center and four extrema, return to center, invalid non-finite input rejection, and finite clamping; unrelated channels must remain unchanged.                            | Phase B semantic test plus visual review                            |
| CAP-BLK-001 | Declare blink curve, duration range, eye coupling, and idle policy. Verify explicit close/reopen, terminal result, seeded idle replay, reset recovery, and operation in reduced-motion mode.                              | Phase B deterministic test plus visual review                       |
| CAP-MOU-001 | Supply closed, midpoint, and open mouth references and affected channels. Verify ordered bounded output, smoothing, finite clamping, non-finite rejection, and no phoneme inference.                                      | Phase B semantic test plus visual review                            |
| CAP-POS-001 | List pose identifiers, targets, transition policy, affected channels, and tolerances. Verify each target becomes stable and an unknown identifier fails without substitution.                                             | Phase B sampled-pose test                                           |
| CAP-INT-001 | Declare priority, cancellation, cross-fade, and resumption policies. Interrupt each action class at multiple fake-clock points; verify one terminal result, no jump, and no stale queued action.                          | Phase B scheduler test                                              |
| CAP-RST-001 | Define the neutral reference for every declared channel. Reset from every action/override state, advance the fake clock, and verify one identical stable neutral pose with no resurrected action.                         | Phase B reset matrix                                                |
| CAP-RED-001 | Mark each motion as essential, direct, or decorative and declare a decorative-motion budget. Compare normal and reduced modes; direct controls and meaning must remain while decorative motion stays within budget.       | Phase B accessibility test plus human review                        |
| CAP-HUM-001 | Run the same expression, motion, gaze, blink, mouth, pose, and reset scenario through human and AI adapters. Before priority differences, acknowledgement and pose logs must be semantically equivalent.                  | Phase B adapter contract test                                       |
| CAP-AIC-001 | Exercise discovery, unsupported content, invalid/non-finite values, rate excess, cancellation, and reset through the AI adapter. Verify bounded work and preservation of the last valid pose.                             | Phase B hostile-command test                                        |
| CAP-HOV-001 | Send simultaneous AI mouth plus human gaze, then conflicting AI and human gaze. Verify channel-local coexistence, human precedence during the override window, and no stale AI jump after release/expiry.                 | Phase B integration test                                            |

## Authoring gate

- [ ] All semantic content identifiers are unique and stable within the fixture.
- [ ] Each affected-channel declaration is explicit; undeclared channels are
      testable for leakage.
- [ ] Neutral state, transition policies, tolerances, and fixture-owned timing
      budgets are recorded.
- [ ] Expression sheet, pose references, gaze extrema, eye closure, and three
      mouth-open references have human visual approval.
- [ ] Reduced-motion classification and budget have accessibility review.
- [ ] RMS-only mouth control is sufficient for v1 content; no v1 asset or
      scenario requires a viseme.
- [ ] Rights inventory passes separately; this checklist does not grant rights.
- [ ] Automated evidence is linked for every table row before the implementation
      gate can pass.

## Scenario matrix

The acceptance report MUST cover these paths:

1. Human-only direct control of every supported semantic capability.
2. AI-only control after discovery, including rejection and cancellation.
3. Equivalent human and AI scenarios through the shared control boundary.
4. Simultaneous non-conflicting human and AI channels.
5. Conflicting human override of AI, release/expiry, and stale-input handling.
6. Interruption and reset at start, midpoint, and near completion.
7. Normal and reduced-motion runs using the same semantic requests.
8. RMS audio-envelope input at silence, midpoint, peak, and rapid changes.
