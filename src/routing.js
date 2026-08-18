import { zonesApplicableTo } from './nogoZones'

const BROUTER_URL = 'https://brouter.de/brouter'

// 'mtb' is BRouter's mountain-biking profile. Unlike 'trekking' it will route
// over paths OSM tags as foot/pedestrian trails (highway=path/footway without
// bicycle=designated), which is what lets these rides use Eau Claire's park
// and riverside trail network instead of detouring onto streets. Like
// trekking, it needs no API key, unlike GraphHopper/Mapbox/ORS.
export const DEFAULT_PROFILE = 'mtb'

// points: array of [lng, lat], routed through in order (BRouter takes
// multiple lonlats in one request, so a full loop like home -> stop ->
// stop -> home is a single call).
// profile: a preset can pin itself to a different BRouter profile when its
// geometry was hand-tuned against that profile (see the bridges loop).
// nogoZones: circular areas to route around (busy intersections and the
// like). Zones containing one of `points` are dropped, so a stop inside a
// zone stays reachable instead of failing the whole route.
export async function fetchRoute(points, profile = DEFAULT_PROFILE, nogoZones = []) {
  const url = new URL(BROUTER_URL)
  url.searchParams.set('lonlats', points.map(([lng, lat]) => `${lng},${lat}`).join('|'))
  url.searchParams.set('profile', profile)

  // BRouter wants nogos as lon,lat,radius triples - longitude first, matching
  // its lonlats param and the opposite of the CSV's column order.
  const activeZones = zonesApplicableTo(nogoZones, points)
  if (activeZones.length > 0) {
    url.searchParams.set(
      'nogos',
      activeZones.map((zone) => `${zone.lng},${zone.lat},${zone.radiusMeters}`).join('|'),
    )
  }
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
