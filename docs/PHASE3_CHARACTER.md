# Silver Rush 3D — Phase 3 character art contract

This branch implements an incremental authored procedural armor pass and more responsive action poses. **It does not include a studio-quality skinned GLB asset.**

## Hero model acceptance criteria
- Fully original design: silver body armor, cobalt-blue accent panels and cyan energy highlights. Do not reuse Pepsiman branding, characters, or other proprietary assets.
- Provide `public/models/silver-runner.glb` with documented license/creator, realistic mobile triangle and texture budgets, and optimized material count.
- Export a real humanoid skeleton and clips named `Idle`, `Run`, `Jump`, `Slide`, `Hit`. Match clip transitions to actual runner gameplay events, not simple mesh squashing.
- Keep the collision simulation separate from mesh appearance. The game uses `Runner` simulation data as its source of truth.
- Integrate an asynchronous loader with a visible fallback only on loading failure, then register the loaded meshes with the shadow caster set.
- Add lightweight lower LODs and test draw calls and GPU time on actual phones before claiming an FPS target.
- Verify materials (metallic/roughness, normal maps, blue accents) under the scene's lighting.
- Keep keyboard/swipe controls, score, saves, level progression, sound, and PWA intact.

## Implemented in this pull request
- Added original visor, chest, shoulder, thigh and shin armor details.
- Smoothed slide/jump pose transitions and added an impact response on damage.
- Kept original procedural animation system intact for existing gameplay.

## Validation
CI checks must report success for `npm test`, `npm run build` and browser E2E. Performance and visual fidelity require human/device review; do not invent benchmark data.

## Next art production task
Commission/model a properly skinned GLB character in Blender (or another DCC) and import it in a subsequent focused PR. The current procedural runner is not equivalent to this deliverable.
