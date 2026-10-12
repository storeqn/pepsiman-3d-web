# Phase 4 — Downtown art and material pass

This is an incremental visual pass, not a finished AAA environment or professionally skinned character.

## Implemented
- Reusable PBR facade palette to avoid creating one unique material per building (better batching/memory characteristics, subject to measurements).
- Roof parapets and service housings for more varied downtown silhouettes.
- Architectural shop accent lighting and mullion details.
- Road edge lane paint and sidewalk seams to clarify environmental depth and road boundaries.
- Minor PBR material rendering setup and repeat wrapping for generated asphalt grain.

## Still required before final art sign-off
- Original high-quality GLB skinned hero character with authored idle/run/jump/slide/hit clips.
- Art-directed storefront props, believable vehicle geometry, normal/roughness maps, and proper authored LOD/instancing for high object counts.
- Device-based mobile benchmarks, screenshot comparison, visual and input QA.
- No FPS benchmark or production-ready GLB asset is claimed by this PR.

## Guardrails
Keep existing runner collision logic, menus, controls, saves and PWA unchanged. No third-party copyrighted art was added.

## Checks
CI must pass `npm test`, `npm run build`, and `npm run test:e2e` before merge. Visual QA still requires running the game on actual phone hardware.
