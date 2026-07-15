// Fetches cycling trail geometry from OpenStreetMap (via Overpass API) for the
// Eau Claire, WI area and writes it out as a static GeoJSON file the app can
// load at runtime, so the app doesn't depend on Overpass being reachable
// while someone is out riding.
//
// Run with: node scripts/fetch-trails.mjs

import { writeFile } from 'node:fs/promises'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Covers the city of Eau Claire plus enough of the Chippewa River State
// Trail and Old Abe State Trail corridors to be useful.
const BBOX = { south: 44.72, west: -91.6, north: 44.92, east: -91.38 }

const query = `
[out:json][timeout:90];
(
  way["highway"="cycleway"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["highway"~"^(path|track|footway)$"]["bicycle"~"^(yes|designated)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom;
`

function wayToFeature(way) {
  return {
    type: 'Feature',
    id: way.id,
    properties: {
      name: way.tags?.name ?? null,
      highway: way.tags?.highway ?? null,
      surface: way.tags?.surface ?? null,
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
  console.log(`Wrote ${geojson.features.length} trail segments to public/data/trails.geojson`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
