// Fetches cycling infrastructure geometry from OpenStreetMap (via Overpass
// API) for the Eau Claire, WI area and writes it out as a static GeoJSON file
// the app can load at runtime, so the app doesn't depend on Overpass being
// reachable while someone is out riding.
//
// Run with: node scripts/fetch-trails.mjs

import { writeFile } from 'node:fs/promises'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Covers the city of Eau Claire plus enough of the Chippewa River State
// Trail and Old Abe State Trail corridors to be useful.
const BBOX = { south: 44.72, west: -91.6, north: 44.92, east: -91.38 }

// cycleway(:left/right/both) values that mean a real, ride-able lane/track,
// as opposed to "no" or crossing/traffic-island markings.
const LANE_VALUES = '^(lane|track|opposite_lane|opposite_track|share_busway)$'
const SHARED_VALUES = '^(shared_lane|shared)$'

const query = `
[out:json][timeout:90];
(
  way["highway"="cycleway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["highway"~"^(path|track|footway)$"]["bicycle"~"^(yes|designated)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});

  way["cycleway"~"${LANE_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["cycleway:left"~"${LANE_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["cycleway:right"~"${LANE_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["cycleway:both"~"${LANE_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});

  way["cycleway"~"${SHARED_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["cycleway:left"~"${SHARED_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["cycleway:right"~"${SHARED_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["cycleway:both"~"${SHARED_VALUES}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["bicycle"="designated"]["highway"!~"^(path|track|footway|cycleway)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom;
`

// Classifies a way into how it's ridden: a car-free trail/path, a marked
// on-road lane or track, or a shared/advisory lane with no dedicated space.
function classify(tags) {
  const highway = tags.highway
  const bicycle = tags.bicycle

  const isDedicatedTrail =
    highway === 'cycleway' ||
    (['path', 'track', 'footway'].includes(highway) && ['yes', 'designated'].includes(bicycle))
  if (isDedicatedTrail) return 'trail'

  const cyclewayValues = [tags.cycleway, tags['cycleway:left'], tags['cycleway:right'], tags['cycleway:both']]
  const laneValues = new Set(['lane', 'track', 'opposite_lane', 'opposite_track', 'share_busway'])
  const sharedValues = new Set(['shared_lane', 'shared'])

  if (cyclewayValues.some((value) => laneValues.has(value))) return 'lane'
  if (cyclewayValues.some((value) => sharedValues.has(value)) || bicycle === 'designated') return 'shared'

  return 'shared'
}

function wayToFeature(way) {
  const tags = way.tags ?? {}
  return {
    type: 'Feature',
    id: way.id,
    properties: {
      name: tags.name ?? null,
      highway: tags.highway ?? null,
      surface: tags.surface ?? null,
      category: classify(tags),
    },
    geometry: {
      type: 'LineString',
      coordinates: way.geometry.map((point) => [point.lon, point.lat]),
    },
  }
}

async function main() {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: '*/*',
      'User-Agent': 'cycling-wayfinding-app/0.1 (fetch-trails.mjs)',
    },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const ways = data.elements.filter((element) => element.type === 'way')

  const geojson = {
    type: 'FeatureCollection',
    features: ways.map(wayToFeature),
  }

  await writeFile('public/data/trails.geojson', JSON.stringify(geojson))

  const counts = geojson.features.reduce((acc, feature) => {
    const category = feature.properties.category
    acc[category] = (acc[category] ?? 0) + 1
    return acc
  }, {})
  console.log(`Wrote ${geojson.features.length} segments to public/data/trails.geojson`, counts)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
