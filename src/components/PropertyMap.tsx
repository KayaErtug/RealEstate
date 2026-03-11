// src/components/PropertyMap.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from '@vis.gl/react-google-maps';
import type { Property } from '../lib/database.types';

interface MapBoundsValue {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface PropertyMapProps {
  properties: Property[];
  onSelect: (id: string) => void;
  onBoundsChange?: (bounds: MapBoundsValue) => void;
}

type PropertyWithMap = Property & {
  latitude?: number | null;
  longitude?: number | null;
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function MapBoundsListener({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: MapBoundsValue) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !onBoundsChange) return;

    const emitBounds = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      onBoundsChange({
        north: bounds.getNorthEast().lat(),
        east: bounds.getNorthEast().lng(),
        south: bounds.getSouthWest().lat(),
        west: bounds.getSouthWest().lng(),
      });
    };

    const idleListener = map.addListener('idle', emitBounds);

    window.setTimeout(emitBounds, 150);

    return () => {
      idleListener.remove();
    };
  }, [map, onBoundsChange]);

  return null;
}

function FitBoundsToProperties({
  properties,
}: {
  properties: Property[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || properties.length === 0) return;

    const points = properties
      .map((property) => {
        const row = property as PropertyWithMap;

        if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') {
          return null;
        }

        return { lat: row.latitude, lng: row.longitude };
      })
      .filter(Boolean) as Array<{ lat: number; lng: number }>;

    if (points.length === 0) return;

    if (points.length === 1) {
      map.panTo(points[0]);
      map.setZoom(14);
      return;
    }

    const north = Math.max(...points.map((p) => p.lat));
    const south = Math.min(...points.map((p) => p.lat));
    const east = Math.max(...points.map((p) => p.lng));
    const west = Math.min(...points.map((p) => p.lng));

    map.fitBounds({
      north,
      south,
      east,
      west,
    });
  }, [map, properties]);

  return null;
}

export default function PropertyMap({ properties, onSelect, onBoundsChange }: PropertyMapProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const mappedProperties = useMemo(() => {
    return properties.filter((property) => {
      const row = property as PropertyWithMap;
      return typeof row.latitude === 'number' && typeof row.longitude === 'number';
    });
  }, [properties]);

  const defaultCenter = useMemo(() => {
    if (mappedProperties.length > 0) {
      const first = mappedProperties[0] as PropertyWithMap;

      return {
        lat: Number(first.latitude),
        lng: Number(first.longitude),
      };
    }

    return { lat: 37.7765, lng: 29.0864 };
  }, [mappedProperties]);

  const selectedProperty = selectedPropertyId
    ? mappedProperties.find((property) => property.id === selectedPropertyId) || null
    : null;

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-center text-red-700">
        .env dosyasına <span className="mx-1 font-medium">VITE_GOOGLE_MAPS_API_KEY</span> eklenmeli.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="h-[360px] w-full">
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
            <MapBoundsListener onBoundsChange={onBoundsChange} />
            <FitBoundsToProperties properties={mappedProperties} />

            {mappedProperties.map((property) => {
              const row = property as PropertyWithMap;
              const latitude = Number(row.latitude);
              const longitude = Number(row.longitude);

              return (
                <Marker
                  key={property.id}
                  position={{ lat: latitude, lng: longitude }}
                  onClick={() => setSelectedPropertyId(property.id)}
                />
              );
            })}

            {selectedProperty && (
              <InfoWindow
                position={{
                  lat: Number((selectedProperty as PropertyWithMap).latitude),
                  lng: Number((selectedProperty as PropertyWithMap).longitude),
                }}
                onClose={() => setSelectedPropertyId(null)}
              >
                <div className="w-[220px]">
                  {Array.isArray(selectedProperty.images) && selectedProperty.images.length > 0 ? (
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="mb-2 h-28 w-full rounded object-cover"
                    />
                  ) : null}

                  <div className="mb-1 text-sm font-semibold">{selectedProperty.title}</div>

                  <div className="mb-2 font-bold text-emerald-600">
                    {selectedProperty.price} {selectedProperty.currency}
                  </div>

                  <button
                    onClick={() => onSelect(selectedProperty.id)}
                    className="rounded bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                  >
                    İlanı Aç
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}