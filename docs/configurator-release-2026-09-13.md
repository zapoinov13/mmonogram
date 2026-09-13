# Configurator release audit, 2026-09-13

## Source inventory

Scanned the converted source exports, including node/material/animation metadata.
This inventory is not a claim that every CAD polygon matches the photographed build.

| Source | Meshes | Triangles | Textures | Animations |
| --- | ---: | ---: | ---: | ---: |
| Stock body | 88 | 1,585,387 | 1 | 0 |
| Custom body kit and wheels | 44 | 8,329,412 | 0 | 0 |
| Custom interior | 132 | 10,478,833 | 0 | 0 |
| Steering wheel | 4 | 135,682 | 0 | 0 |
| Full CAD interior | 2,539 | 17,800,983 | 0 | 0 |

`scripts/audit-source-parts.ts` lists unmapped custom nodes and their source-space
bounds. Unmapped is a review candidate, not automatic proof of a missing part:
the custom file also duplicates the steering, dashboard and CAD assemblies.

## Changes in this release

- Restored the four small original door inserts `Плоскость.013/.025/.055/.057`
  to the metallic trim mapping; retained the original source placement.
- Preserved the source sunroof size and shape, with a dedicated dark material
  that writes depth. It no longer behaves like nearly invisible side-window glass.
- Extracted all six original wheel-face nodes from the supplied body kit,
  without a simplification pass. The source has 958,176 triangles, including
  29,541 measured zero-area faces; Draco output contains 929,316 triangles.
  Original tires remain separate; replacement faces are hidden to prevent doubles.
- Reduced wheel reflections that obscured the spoke shapes.
- All required body/cabin assets share the loading/error boundary. A failed
  request now shows an explicit reload action, never the old procedural car
  or a cabin silently missing its dashboard/steering.
- Storage failure no longer reports a build as saved; the share URL is offered.
- Caliper controls are only shown for the alternative wheels with independently
  modeled calipers. The original enclosed wheels do not have this separation.
- Added source-geometry, loading and shared-configuration regression checks.
  Vercel runs `npm run verify`, including all TypeScript test suites, before release.
- Applied compatible dependency security updates; npm audit reports zero issues.

## Verification

- Lint, TypeScript, configurator source checks, build and 29-page SEO check.
- Original wheel/source geometry and file-size tests; default/deep/shared URL tests.
- Desktop source-wheel view and switching to alternative wheel/caliper geometry.
- Roof exterior and driver/rear cabin visual checks; mobile driver view.
- Forced HTTP 503 for `instruments-original.glb`: explicit error shown, then the
  Reload model button recovered the full car after the asset became available.
- Complete default model downloads total approximately 24 MiB, excluding fonts,
  application code and environment assets. This is not an FPS benchmark.

## Remaining product limitations

- This is a checked release of the existing configurator, not completion of every
  item in the original feature wish list or a certified 1:1 photographic replica.
- Four-door, hood and trunk opening is not implemented for this assembly. The
  exports have no animations/rigs; separate panel geometry/pivots need authoring.
- An independent stock assembly and individually selectable complete carbon kit
  are not supplied by the current public UI; the configured body kit stays on.
- Most supplied interior geometry has no authored PBR texture set. Upholstery,
  fine engravings and some CAD surfaces still differ from the project photography.
- Unknown custom nodes must be inspected before enabling them to avoid overlapping
  original and replacement parts. Exhaustive per-polygon visual QA was not performed.
- Price is the existing estimate, not a confirmed commercial quotation.

## Release route and rollback

Push only to `zapoinov13/mmonogram`, branch `main`. Confirm the resulting GitHub
deployment and the actual `mmonogram.com` bundle/model response, not another project.
Rollback: revert this release commit in a new commit and push to the same branch;
do not reset history or repoint the domain.
