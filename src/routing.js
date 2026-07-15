const BROUTER_URL = 'https://brouter.de/brouter'

// 'trekking' is BRouter's general-purpose cycle-touring profile: it prefers
// dedicated trails/lanes over busy roads without needing an API key, unlike
// GraphHopper/Mapbox/ORS.
const PROFILE = 'trekking'

// points: array of [lng, lat], routed through in order (BRouter takes
// multiple lonlats in one request, so a full loop like home -> stop ->
// stop -> home is a single call).
export async function fetchRoute(points) {
  const url = new URL(BROUTER_URL)
  url.searchParams.set('lonlats', points.map(([lng, lat]) => `${lng},${lat}`).join('|'))
  url.searchParams.set('profile', PROFILE)
  url.searchParams.set('alternativeidx', '0')
  url.searchParams.set('format', 'geojson')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Routing request failed (${response.status})`)
  }

  const data = await response.json()
  const feature = data.features?.[0]
  if (!feature) {
    throw new Error('No route found between those points')
  }

  return {
    geojson: { type: 'FeatureCollection', features: [feature] },
    distanceMeters: Number(feature.properties['track-length']),
    durationSeconds: Number(feature.properties['total-time']),
  }
}
