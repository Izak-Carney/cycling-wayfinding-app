import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchRoute } from './routing'

// Eau Claire, WI
const EAU_CLAIRE_CENTER = [-91.4985, 44.8113]
const INITIAL_ZOOM = 13

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

const TRAILS_SOURCE_ID = 'trails'
const TRAILS_DATA_URL = '/data/trails.geojson'

const ROUTE_SOURCE_ID = 'route'
const EMPTY_FEATURE_COLLECTION = { type: 'FeatureCollection', features: [] }

function MapView() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const startMarkerRef = useRef(null)
  const endMarkerRef = useRef(null)

  const [points, setPoints] = useState([])
  const [routeStats, setRouteStats] = useState(null)
  const [routeError, setRouteError] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    // Guards against React StrictMode's dev-only double-invoke of this effect:
    // without this, a second map instance races the first one's async 'load'
    // event and the trail source ends up attached to a map that already got
    // torn down. This map is a page-level singleton for the app's lifetime,
    // so it's fine to never tear it down.
    if (mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: OSM_RASTER_STYLE,
      center: EAU_CLAIRE_CENTER,
      zoom: INITIAL_ZOOM,
    })
    mapRef.current = map

    // The container can grow after the map is constructed (e.g. the browser
    // finishing its own layout pass) without MapLibre noticing on its own,
    // leaving the canvas stuck at its stale initial size.
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    )

    map.on('load', () => {
      map.addSource(TRAILS_SOURCE_ID, {
        type: 'geojson',
        data: TRAILS_DATA_URL,
      })

      const notShared = ['!=', ['get', 'category'], 'shared']

      // Dedicated trails and on-road lanes/tracks: solid lines, color and
      // width driven by category, with a white casing for contrast against
      // the base map.
      map.addLayer({
        id: 'trails-casing',
        type: 'line',
        source: TRAILS_SOURCE_ID,
        filter: notShared,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': ['match', ['get', 'category'], 'trail', 5, 4],
          'line-opacity': 0.8,
        },
      })

      map.addLayer({
        id: 'trails-line',
        type: 'line',
        source: TRAILS_SOURCE_ID,
        filter: notShared,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['match', ['get', 'category'], 'trail', '#1a8a3d', '#1d6fd6'],
          'line-width': ['match', ['get', 'category'], 'trail', 3, 2.5],
        },
      })

      // Shared lanes / advisory shoulders / bike-friendly roads with no
      // dedicated space: dashed, since line-dasharray isn't data-driven in
      // the style spec, this needs its own layer rather than a match branch.
      map.addLayer({
        id: 'trails-shared',
        type: 'line',
        source: TRAILS_SOURCE_ID,
        filter: ['==', ['get', 'category'], 'shared'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#d97706',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      })

      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_FEATURE_COLLECTION,
      })

      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 7,
          'line-opacity': 0.9,
        },
      })

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#6d28d9',
          'line-width': 4,
        },
      })
    })

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      setPoints((prev) => (prev.length >= 2 ? [[lng, lat]] : [...prev, [lng, lat]]))
    })
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    startMarkerRef.current?.remove()
    endMarkerRef.current?.remove()
    startMarkerRef.current = points[0]
      ? new maplibregl.Marker({ color: '#16a34a' }).setLngLat(points[0]).addTo(map)
      : null
    endMarkerRef.current = points[1]
      ? new maplibregl.Marker({ color: '#dc2626' }).setLngLat(points[1]).addTo(map)
      : null

    const routeSource = map.getSource(ROUTE_SOURCE_ID)

    if (points.length < 2) {
      routeSource?.setData(EMPTY_FEATURE_COLLECTION)
      setRouteStats(null)
      setRouteError(null)
      return
    }

    let cancelled = false
    setRouteLoading(true)
    setRouteError(null)

    fetchRoute(points[0], points[1])
      .then(({ geojson, distanceMeters, durationSeconds }) => {
        if (cancelled) return
        routeSource?.setData(geojson)
        setRouteStats({ distanceMeters, durationSeconds })
      })
      .catch((error) => {
        if (cancelled) return
        routeSource?.setData(EMPTY_FEATURE_COLLECTION)
        setRouteError(error.message)
      })
      .finally(() => {
        if (!cancelled) setRouteLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [points])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <RouteInfo
        points={points}
        loading={routeLoading}
        error={routeError}
        stats={routeStats}
        onClear={() => setPoints([])}
      />
      <Legend />
    </div>
  )
}

function RouteInfo({ points, loading, error, stats, onClear }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'white',
        borderRadius: 4,
        padding: '8px 10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        fontSize: 13,
        color: '#222',
        maxWidth: 260,
      }}
    >
      {points.length === 0 && <div>Click the map to set a start point, then click again for your destination.</div>}
      {points.length === 1 && <div>Click the map again to set your destination.</div>}
      {loading && <div>Calculating route…</div>}
      {error && <div style={{ color: '#b91c1c' }}>Couldn't find a route: {error}</div>}
      {stats && !loading && !error && (
        <div>
          {(stats.distanceMeters / 1609.34).toFixed(1)} mi &middot; {Math.round(stats.durationSeconds / 60)} min
        </div>
      )}
      {points.length > 0 && (
        <button onClick={onClear} style={{ marginTop: 6 }}>
          Clear route
        </button>
      )}
    </div>
  )
}

function Legend() {
  const items = [
    { label: 'Trail / off-road path', color: '#1a8a3d', dashed: false },
    { label: 'On-road bike lane', color: '#1d6fd6', dashed: false },
    { label: 'Shared lane / advisory', color: '#d97706', dashed: true },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 8,
        background: 'white',
        borderRadius: 4,
        padding: '8px 10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        fontSize: 12,
        lineHeight: 1.6,
        color: '#222',
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="20" height="10">
            <line
              x1="0"
              y1="5"
              x2="20"
              y2="5"
              stroke={item.color}
              strokeWidth="3"
              strokeDasharray={item.dashed ? '3,3' : undefined}
            />
          </svg>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default MapView
