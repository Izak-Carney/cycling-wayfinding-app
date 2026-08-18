# Eau Claire Cycling Wayfinding App

A map-based ride planner for Eau Claire, WI. Visitors renting an e-bike from
Volume One & The Local Store (205 N Dewey St) answer a short preferences quiz
and get a suggested sightseeing loop that starts and ends at the rental
counter, drawn over the city's cycling infrastructure. Riders can also click
the map to build their own route.

## Running it

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint` (Oxlint).

## Routing

Routes come from the public [BRouter](https://brouter.de) service, which needs
no API key. `src/routing.js` builds a single request per route - BRouter takes
all the waypoints at once, so a full loop is one call.

### Profiles

The default profile is **`mtb`**. Unlike BRouter's `trekking` profile, `mtb`
will route over paths OSM tags as foot/pedestrian trails, which is what lets
these rides use Eau Claire's park and riverside path network instead of
detouring onto streets. The trade-off is that `mtb` does not distinguish a
pedestrian path that rides fine from one tagged `bicycle=dismount`, so a
couple of routes include short campus footway segments.

A preset can pin itself to a different profile with `routingProfile`. The
**Bridges of Eau Claire Loop** is pinned to `trekking`: its ordering and its
21 bridge-end waypoints were tuned leg-by-leg against trekking geometry to
produce a true Eulerian circuit - ten bridges, each crossed exactly once, no
double-backs - and re-routing it with `mtb` changes the line (10,749 m ->
11,279 m). Any change to routing should be checked against that loop's
geometry, not just its distance.

### No-go zones

Circular areas riders should never be routed through - busy intersections and
the like - live in `public/data/nogo-zones.csv`, so the list can be edited
without touching code or rebuilding. One zone per row:

```
latitude,longitude,radius_m
44.818499,-91.45969,45
```

Blank lines, `#` comments, and the header row are skipped; a malformed row is
warned about in the console rather than silently dropped.

Note the column order: the CSV is **latitude first**, matching how coordinates
are usually written down, while BRouter's `nogos` parameter and the route
geometry elsewhere in this codebase are **longitude first**. `src/nogoZones.js`
does the conversion.

A zone is ignored for any ride that has one of its own stops inside it, so a
destination within a zone stays reachable. Without that exemption BRouter
rejects the whole route with `last wpt in restricted area`. Zones are drawn on
the map as real polygons rather than a MapLibre circle layer, whose radius is
in screen pixels and would not track the zone's true footprint across zoom
levels.

## Deployment

The site is published to GitHub Pages at
<https://izak-carney.github.io/cycling-wayfinding-app/> by
`.github/workflows/deploy.yml`, which builds and deploys on every push to
`main`. Pages is configured with **GitHub Actions** as its source, not
"deploy from a branch" - pointing Pages at the repo root serves the unbuilt
`index.html`, whose `/src/main.jsx` script tag the browser cannot execute, and
the page renders blank.

Because this is a *project* page served from a `/cycling-wayfinding-app/`
subpath rather than a domain root, two things have to respect that prefix:

- `vite.config.js` sets `base` to the repo name for production builds (dev
  stays on `/`).
- Anything fetched from `public/` uses `import.meta.env.BASE_URL` rather than a
  hardcoded `/data/...` path, which would 404 under the subpath.

If the repo is ever renamed, `GITHUB_PAGES_BASE` in `vite.config.js` has to
change with it.

## Map data

The base map is OpenStreetMap raster tiles via MapLibre GL. The cycling
infrastructure overlay is a static GeoJSON file, `public/data/trails.geojson`,
so the app does not depend on Overpass being reachable while someone is out
riding. Regenerate it with:

```bash
node scripts/fetch-trails.mjs
```

## Layout

| Path | What it holds |
| --- | --- |
| `src/MapView.jsx` | The map, route rendering, markers, legend, info panel |
| `src/presets.js` | Home base and the six sightseeing routes, with the reasoning behind each route's stop order |
| `src/routing.js` | BRouter request building, profiles |
| `src/nogoZones.js` | No-go zone parsing, the destination exemption, circle geometry |
| `src/quiz.js`, `src/PreferencesQuiz.jsx` | Preferences quiz and route matching |
| `scripts/fetch-trails.mjs` | Regenerates the trails overlay from OpenStreetMap |

Preset coordinates are verified against OpenStreetMap rather than estimated, a
wrong pin sends a visiting rider to the wrong spot. Because BRouter snaps each
waypoint to the nearest routable way, stop coordinates need to sit on the way
the route is meant to use.
