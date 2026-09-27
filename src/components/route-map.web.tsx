import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { C } from '@/components/demo-ui';
import type { RouteMapProps } from '@/components/route-map-types';

export function RouteMap({ stations, relas, ride, pickupId }: RouteMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let frame: number | undefined;
    import('leaflet').then((L) => {
      if (disposed || !container.current) return;
      leaflet.current = L;
      const instance = L.map(container.current, { zoomControl: true });
      map.current = instance;
      instance.fitBounds(L.latLngBounds(stations.map((station) => [station.latitude, station.longitude])), { padding: [24, 24] });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // OSM requires a Referer; send only the origin, never page paths or reset tokens.
        referrerPolicy: 'strict-origin',
      }).on('tileerror', () => setTilesFailed(true)).addTo(instance);
      markers.current = L.layerGroup().addTo(instance);
      setReady(true);
      frame = requestAnimationFrame(() => instance.invalidateSize());
    }).catch(() => { if (!disposed) setTilesFailed(true); });
    return () => {
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      map.current?.remove();
      map.current = null;
      markers.current = null;
      leaflet.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leaflet.current;
    const layer = markers.current;
    if (!L || !layer) return;
    layer.clearLayers();
    stations.forEach((station) => {
      const kind = station.id === ride?.pickupId || station.id === pickupId ? 'Pickup' : station.id === ride?.dropoffId ? 'Drop-off' : 'Station';
      const color = kind === 'Pickup' ? C.green : kind === 'Drop-off' ? C.red : C.navy;
      L.circleMarker([station.latitude, station.longitude], { radius: 8, color: C.white, weight: 2, fillColor: color, fillOpacity: 1 })
        .bindTooltip(station.name, { permanent: true, direction: station.id === 4 ? 'left' : station.id === 5 ? 'right' : 'top', offset: [0, -4] })
        .bindPopup(`${station.name} · ${kind} · Approximate station location`)
        .addTo(layer);
    });
    relas.forEach((rela) => {
      const station = stations.find((item) => item.id === rela.currentStationId);
      if (!station) return;
      L.circleMarker([station.latitude, station.longitude + 0.00035], { radius: 10, color: C.white, weight: 2, fillColor: C.amber, fillOpacity: 1 })
        .bindTooltip(rela.code, { permanent: true, direction: 'bottom', offset: [0, 6] })
        .bindPopup(`${rela.code} · ${station.name} · ${rela.capacity - rela.passengers} seats available · Driver-reported station`)
        .addTo(layer);
    });
  }, [stations, relas, ride, pickupId, ready]);

  return <div style={{ height: 280, position: 'relative', overflow: 'hidden', borderRadius: 12, background: C.pale }}>
    <div ref={container} aria-label="Interactive map of the TAPSAKAY route" style={{ width: '100%', height: '100%' }} />
    {(!ready || tilesFailed) && <div role="status" aria-live="polite" style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000, maxWidth: '85%', padding: '9px 11px', borderRadius: 10, color: C.navy, background: C.white, fontSize: 12, boxShadow: '0 2px 8px rgba(4, 55, 123, 0.1)' }}>{!ready ? 'Loading route map…' : 'Map tiles unavailable. Use the station list below.'}</div>}
  </div>;
}
