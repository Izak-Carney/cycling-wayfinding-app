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

      map.addLayer({
        id: 'trails-casing',
        type: 'line',
        source: TRAILS_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 5,
          'line-opacity': 0.8,
        },
      })

      map.addLayer({
        id: 'trails-line',
        type: 'line',
        source: TRAILS_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1a8a3d',
          'line-width': 3,
        },
      })
    })
  }, [])

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
}

export default MapView
