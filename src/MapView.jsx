import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

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

function MapView() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)

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
    })
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <Legend />
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
