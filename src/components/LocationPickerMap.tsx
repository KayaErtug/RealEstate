// src/components/LocationPickerMap.tsx
import { useEffect, useMemo } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function MapClickListener({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('click', (event: any) => {
      if (!event?.latLng) return;

      const lat = Number(event.latLng.lat().toFixed(6));
      const lng = Number(event.latLng.lng().toFixed(6));

      onChange(lat, lng);
    });

    return () => {
      listener.remove();
    };
  }, [map, onChange]);

  return null;
}

function MapCenterSync({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

    map.panTo({ lat: latitude, lng: longitude });
  }, [map, latitude, longitude]);

  return null;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = 360,
}: LocationPickerMapProps) {
  const defaultCenter = useMemo(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return { lat: latitude, lng: longitude };
    }

    return { lat: 37.7765, lng: 29.0864 };
  }, [latitude, longitude]);

  const markerPosition =
    typeof latitude === 'number' && typeof longitude === 'number'
      ? { lat: latitude, lng: longitude }
      : null;

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="border-b border-red-100 px-4 py-3">
          <h3 className="text-base font-semibold text-red-700">Google Maps API anahtarı eksik</h3>
          <p className="mt-1 text-sm text-gray-600">
            .env dosyasına <span className="font-medium">VITE_GOOGLE_MAPS_API_KEY</span> ekle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">Konum Seçimi</h3>
        <p className="mt-1 text-sm text-gray-500">
          Haritada konuma tıklayın. Latitude ve longitude otomatik doldurulur.
        </p>
      </div>

      <div style={{ height: `${height}px`, width: '100%' }}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="tr" region="TR">
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={13}
            gestureHandling="greedy"
            fullscreenControl={true}
            streetViewControl={false}
            mapTypeControl={true}
            zoomControl={true}
            className="h-full w-full"
          >
            <MapClickListener onChange={onChange} />
            <MapCenterSync latitude={latitude} longitude={longitude} />

            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={(event: any) => {
                  if (!event?.latLng) return;

                  const lat = Number(event.latLng.lat().toFixed(6));
                  const lng = Number(event.latLng.lng().toFixed(6));

                  onChange(lat, lng);
                }}
              />
            )}
          </Map>
        </APIProvider>
      </div>

      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 px-4 py-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Latitude</label>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {latitude ?? '-'}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Longitude</label>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
            {longitude ?? '-'}
          </div>
        </div>
      </div>
    </div>
  );
}