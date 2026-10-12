# Phase 2 — visual upgrade (incremental)

This branch improves the existing Phase 1 game without replacing gameplay, scoring, persistence, touchscreen input, or PWA support.

## Implemented
- Responsive third-person camera with independent damped position and target tracking.
- Original procedural silver/blue runner detailing (reactor, helmet crest, collar) and animated joint hinges.
- Downtown dressing: traffic signals, delivery trucks, bollards and shop thresholds. Existing merge-by-material batching retained.
- Auto/Low/Medium/High rendering options remain compatible with saved preferences. Auto now uses 5-second observed frame-rate windows and hysteresis/cooldowns, avoiding endless quality oscillation.

## Not yet delivered
- **The current runner is still procedural geometry, not a production GLB/glTF skinned rig.** Do not label it a finished high-poly hero asset.
- Animated commercial-quality authored motion clips and production-grade art direction need dedicated asset creation and review.
- GLB loading and GPU instancing of a final asset pack, authored LOD meshes and baked reflection probes are not included in this incremental PR.
- Mobile GPU profiling, measured performance benchmarks and device screenshots are pending actual device testing.

## Validation
- CI configured in `.github/workflows/ci.yml` is the source of truth for build/tests on this branch.
- The GitHub connector cannot execute `npm run build` directly. Build status must be confirmed from CI, never inferred.
- Test the menu, jump/slide/swipes/keyboard, obstacles, score, saved options and install prompt on target browsers before merge.

## Licensing
All new visual details are created procedurally from Babylon primitives; no external copyrighted game artwork or assets have been imported.
