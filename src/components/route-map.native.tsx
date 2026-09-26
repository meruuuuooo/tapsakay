import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type LatLng } from 'react-native-maps';
import { C } from '@/components/demo-ui';
import type { RouteMapProps } from '@/components/route-map-types';
import { stations } from '@/data/mock';

const coordinates = stations.map(({ latitude, longitude }) => ({ latitude, longitude }));

export function RouteMap({ relas, ride, pickupId }: RouteMapProps) {
  const map = useRef<MapView>(null);
  return <View style={styles.frame}>
    <MapView
      ref={map}
      style={styles.map}
      initialRegion={{ latitude: 7.811, longitude: 125.027, latitudeDelta: 0.145, longitudeDelta: 0.11 }}
      loadingEnabled
      onMapReady={() => map.current?.fitToCoordinates(coordinates, { edgePadding: { top: 42, right: 42, bottom: 42, left: 42 }, animated: false })}
      accessibilityLabel="Interactive map of the TAPSAKAY demo route"
    >
      {stations.map((station) => {
        const kind = station.id === ride?.pickupId || station.id === pickupId ? 'Pickup' : station.id === ride?.dropoffId ? 'Drop-off' : 'Station';
        const pinColor = kind === 'Pickup' ? C.green : kind === 'Drop-off' ? C.red : C.navy;
        return <Marker key={`station-${station.id}`} coordinate={{ latitude: station.latitude, longitude: station.longitude }} title={station.name} description={`${kind} · Approximate demo location`} pinColor={pinColor} />;
      })}
      {relas.map((rela) => {
        const station = stations.find((item) => item.id === rela.currentStationId);
        if (!station) return null;
        // Keep the rela visible beside its station pin at this map scale.
        const coordinate: LatLng = { latitude: station.latitude, longitude: station.longitude + 0.00035 };
        return <Marker key={`rela-${rela.id}`} coordinate={coordinate} title={rela.code} description={`${station.name} · ${rela.capacity - rela.passengers} seats available · Simulated position`} pinColor={C.amber} zIndex={2} />;
      })}
    </MapView>
  </View>;
}

const styles = StyleSheet.create({
  frame: { height: 280, overflow: 'hidden', borderRadius: 12, backgroundColor: C.pale },
  map: { flex: 1 },
});
