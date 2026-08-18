// No-go zones are circular areas riders should never be routed through -
// busy intersections and the like. They live in a CSV rather than in code so
// the list can be edited without a rebuild.
export const NOGO_ZONES_URL = '/data/nogo-zones.csv'

// Rows are `latitude,longitude,radius_m`. Blank lines, `#` comments, and a
// leading header row are all skipped, so the file stays hand-editable.
export function parseNogoZones(text) {
  const zones = []

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const fields = line.split(',').map((field) => field.trim())
    const [lat, lng, radiusMeters] = fields.map(Number)

    // The header row is the expected non-numeric line; anything else that
    // fails to parse is a typo worth surfacing rather than silently dropping,
    // since a missing zone routes riders straight through it.
    if (fields.length !== 3 || [lat, lng, radiusMeters].some(Number.isNaN)) {
      if (index === 0 || /latitude/i.test(line)) continue
      console.warn(`Skipping malformed no-go zone on line ${index + 1}: "${line}"`)
      continue
    }

    zones.push({ lat, lng, radiusMeters })
  }

  return zones
}

export async function fetchNogoZones(url = NOGO_ZONES_URL) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not load no-go zones (${response.status})`)
  }
  return parseNogoZones(await response.text())
}

const EARTH_RADIUS_METERS = 6371008.8

// Great-circle distance. At these radii a flat approximation would be fine,
// but this keeps the containment test honest regardless of zone size.
export function distanceMeters([lngA, latA], [lngB, latB]) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(latB - latA)
  const dLng = toRad(lngB - lngA)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

// A zone that contains one of the ride's own waypoints is dropped for that
// ride: the rider's destination is inside it, so blocking it would make the
// stop unreachable (BRouter would fail the leg outright).
export function zonesApplicableTo(zones, points) {
  return zones.filter(
    (zone) => !points.some((point) => distanceMeters(point, [zone.lng, zone.lat]) <= zone.radiusMeters),
  )
}

// GeoJSON circles for drawing the zones on the map. MapLibre's circle layer
// sizes in screen pixels, not metres, so the footprint has to be a real
// polygon to stay correct as the user zooms.
export function zonesToGeoJSON(zones, steps = 64) {
  return {
    type: 'FeatureCollection',
    features: zones.map((zone) => {
      const ring = []
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI
        // Metres -> degrees, with the longitude step widened by latitude.
        const dLat = (zone.radiusMeters * Math.cos(angle)) / 111320
        const dLng =
          (zone.radiusMeters * Math.sin(angle)) / (111320 * Math.cos((zone.lat * Math.PI) / 180))
        ring.push([zone.lng + dLng, zone.lat + dLat])
      }
      return {
        type: 'Feature',
        properties: { radiusMeters: zone.radiusMeters },
        geometry: { type: 'Polygon', coordinates: [ring] },
      }
    }),
  }
}
