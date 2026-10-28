'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { Library } from '@/types/library';
import { validKoreaCoordinate } from '@/lib/geo';
import { useEffect } from 'react';
const icon = L.divIcon({ className:'library-pin-wrap', html:'<span class="library-pin"></span>', iconSize:[24,30], iconAnchor:[12,28] });
function Focus({ selected }: { selected: Library | null }) { const map = useMap(); useEffect(() => { if (selected && typeof selected.lat === 'number' && typeof selected.lng === 'number' && validKoreaCoordinate(selected.lat, selected.lng)) map.flyTo([selected.lat, selected.lng], 13, {duration:.7}); }, [selected,map]); return null; }
export default function LibraryMap({ libraries, selected, onSelect }: { libraries: Library[]; selected: Library | null; onSelect: (l: Library) => void }) {
 const located = libraries.filter((l) => validKoreaCoordinate(l.lat,l.lng));
 return <MapContainer center={[36.35,127.8]} zoom={7} scrollWheelZoom className="map-canvas"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MarkerClusterGroup chunkedLoading>{located.map(l=><Marker key={l.id} position={[l.lat!,l.lng!]} icon={icon} eventHandlers={{click:()=>onSelect(l)}}><Popup><strong>{l.name}</strong><br/>{l.address}</Popup></Marker>)}</MarkerClusterGroup><Focus selected={selected}/></MapContainer>;
}
