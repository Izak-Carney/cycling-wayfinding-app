import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { fetchRoute } from './routing'
import { HOME_BASE, SIGHTSEEING_ROUTES } from './presets'
import PreferencesQuiz from './PreferencesQuiz'

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
  const homeMarkerRef = useRef(null)
  const stopMarkersRef = useRef([])

  // Sightseeing stops between HOME_BASE out and HOME_BASE back; every route
  // is a loop that starts and ends at the e-bike rental pickup point.
  const [waypoints, setWaypoints] = useState([])
  // Some presets (e.g. the bridges loop) need routing forced through exact
  // bridge-end coordinates rather than the displayed stop markers, so BRouter
  // is told to fully traverse each bridge instead of merely passing near it.
  // Null means "derive route points from waypoints", the common case.
  const [routeOverride, setRouteOverride] = useState(null)
  const [routeStats, setRouteStats] = useState(null)
  const [routeError, setRouteError] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(true)

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

      homeMarkerRef.current = new maplibregl.Marker({ color: '#111827' })
        .setLngLat(HOME_BASE.coords)
        .setPopup(new maplibregl.Popup({ offset: 24 }).setText(`${HOME_BASE.name} (start/end, e-bike rentals)`))
        .addTo(map)
    })

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      setWaypoints((prev) => [...prev, { name: null, coords: [lng, lat] }])
      setRouteOverride(null)
    })
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    stopMarkersRef.current.forEach((marker) => marker.remove())
    stopMarkersRef.current = waypoints.map((stop) => {
      const marker = new maplibregl.Marker({ color: '#7c3aed' }).setLngLat(stop.coords)
      if (stop.name) {
        marker.setPopup(new maplibregl.Popup({ offset: 24 }).setText(stop.name))
      }
      return marker.addTo(map)
    })

    const routeSource = map.getSource(ROUTE_SOURCE_ID)

    if (waypoints.length === 0) {
      routeSource?.setData(EMPTY_FEATURE_COLLECTION)
      setRouteStats(null)
      setRouteError(null)
      return
    }

    let cancelled = false
    setRouteLoading(true)
    setRouteError(null)

    const middlePoints = routeOverride ?? waypoints.map((stop) => stop.coords)
    const routePoints = [HOME_BASE.coords, ...middlePoints, HOME_BASE.coords]

    fetchRoute(routePoints)
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
  }, [waypoints, routeOverride])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <RouteInfo
        waypoints={waypoints}
        loading={routeLoading}
        error={routeError}
        stats={routeStats}
        onClear={() => {
          setWaypoints([])
          setRouteOverride(null)
        }}
        onSelectPreset={(route) => {
          setWaypoints(route.stops)
          setRouteOverride(route.routePoints ?? null)
        }}
        onRetakeQuiz={() => setShowQuiz(true)}
      />
      <Legend />
      {showQuiz && (
        <PreferencesQuiz
          onComplete={(route) => {
            setWaypoints(route.stops)
            setRouteOverride(route.routePoints ?? null)
            setShowQuiz(false)
          }}
          onSkip={() => setShowQuiz(false)}
        />
      )}
    </div>
  )
}

function RouteInfo({ waypoints, loading, error, stats, onClear, onSelectPreset, onRetakeQuiz }) {
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
        maxWidth: 280,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Rides from {HOME_BASE.name}</div>

      {waypoints.length === 0 && (
        <div>Pick a sightseeing route below, or click the map to add your own stops.</div>
      )}
      {loading && <div>Calculating route…</div>}
      {error && <div style={{ color: '#b91c1c' }}>Couldn't find a route: {error}</div>}
      {stats && !loading && !error && (
        <div>
          {(stats.distanceMeters / 1609.34).toFixed(1)} mi &middot; {Math.round(stats.durationSeconds / 60)} min loop
        </div>
      )}
      {waypoints.length > 0 && (
        <button onClick={onClear} style={{ marginTop: 6, marginBottom: 8 }}>
          Clear route
        </button>
      )}

      <div style={{ borderTop: '1px solid #ddd', marginTop: 4, paddingTop: 6 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Sightseeing routes</div>
        {SIGHTSEEING_ROUTES.map((route) => (
          <button
            key={route.name}
            onClick={() => onSelectPreset(route)}
            title={route.description}
            style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            {route.name}
          </button>
        ))}
        <button onClick={onRetakeQuiz} style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 4 }}>
          Retake preferences quiz
        </button>
      </div>
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
