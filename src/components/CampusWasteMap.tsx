import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  CampusWasteStation,
  WasteFilterType,
  WasteStreamType
} from '../types';
import {
  CAMPUS_WASTE_STATIONS,
  formatWalkingEstimate,
  isWithinCampusBounds,
  SAU_CAMPUS_BOUNDS,
  SAU_CAMPUS_CENTER,
  WASTE_STREAM_META
} from '../services/campusWasteLocationsService';
import {
  calculateDistanceMeters,
  findNearestStation
} from '../services/wasteVerificationService';
import { Icon } from './Icon';

interface FilterOption {
  id: WasteFilterType;
  label: string;
  dotColor: string;
}

interface CampusWasteMapProps {
  onStartVerification?: (station: CampusWasteStation) => void;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'Tümü', dotColor: '#23633f' },
  { id: 'packaging', label: 'Sarı', dotColor: '#6fb42c' },
  { id: 'paper', label: 'Mavi', dotColor: '#144d8c' },
  { id: 'domestic', label: 'Gri', dotColor: '#58595b' },
  { id: 'battery', label: 'Pil', dotColor: '#c9382b' }
];

const COMPACT_STREAM_SHORT: Record<WasteStreamType, string> = {
  packaging: 'Plastik · Cam · Metal',
  paper: 'Kâğıt · Karton',
  domestic: 'Evsel · Diğer',
  battery: 'Atık Pil (Giriş)'
};

const getMarkerColor = (filter: WasteFilterType): string => {
  if (filter === 'all') return '#23633f';
  return WASTE_STREAM_META[filter].color;
};

const getMarkerSvgMarkup = (filter: WasteFilterType, isSelected: boolean): string => {
  const bg = getMarkerColor(filter);
  const size = isSelected ? 40 : 32;
  const ringClass = isSelected ? 'sau-map-pin selected' : 'sau-map-pin';

  let innerIcon =
    '<path d="m9 5 3-3 3 3M12 2v6H6l-2 4m13-4 4 1-1 4m1-4-4 7 3 4M7 17h8l2 4" />';
  if (filter === 'battery') {
    innerIcon =
      '<rect x="6" y="6" width="12" height="15" rx="2" /><path d="M9.5 6V3.5h5V6M12 10v7m-3-3.5h6" />';
  } else if (filter === 'paper') {
    innerIcon =
      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" /><path d="M6.5 17H20v4H6.5a2.5 2.5 0 0 1 0-4Z" />';
  }

  return `
    <div class="${ringClass}" style="width:${size}px;height:${size}px;background:${bg};">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${innerIcon}
      </svg>
      <span class="sau-pin-tri-dots">
        <i style="background:#6fb42c"></i>
        <i style="background:#144d8c"></i>
        <i style="background:#58595b"></i>
      </span>
    </div>
  `;
};

export const CampusWasteMap: React.FC<CampusWasteMapProps> = ({
  onStartVerification
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeFilter, setActiveFilter] = useState<WasteFilterType>('all');
  const [selectedStation, setSelectedStation] = useState<CampusWasteStation | null>(
    CAMPUS_WASTE_STATIONS[0]
  );
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const filteredStations = CAMPUS_WASTE_STATIONS.filter((station) =>
    activeFilter === 'all' ? true : station.streams.includes(activeFilter)
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SAU_CAMPUS_CENTER,
      zoom: 16,
      minZoom: 15,
      maxZoom: 19,
      maxBounds: SAU_CAMPUS_BOUNDS,
      maxBoundsViscosity: 0.9,
      zoomControl: false
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }
    ).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = markersGroup;

    setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    filteredStations.forEach((station) => {
      const isSelected = selectedStation?.id === station.id;
      const size = isSelected ? 40 : 32;

      const icon = L.divIcon({
        className: 'sau-custom-div-icon',
        html: getMarkerSvgMarkup(activeFilter, isSelected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([station.lat, station.lng], { icon });
      marker.on('click', () => {
        setSelectedStation(station);
        map.flyTo([station.lat, station.lng], Math.max(map.getZoom(), 17), {
          duration: 0.5
        });
      });
      marker.addTo(layer);
    });
  }, [activeFilter, selectedStation, filteredStations]);

  const handleResetCampusView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(SAU_CAMPUS_CENTER, 16, { duration: 0.55 });
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Konum desteklenmiyor.');
      setTimeout(() => setLocationStatus(null), 2400);
      return;
    }

    setLocationStatus('Konum alınıyor...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const nearest = findNearestStation(latitude, longitude);
        setSelectedStation(nearest.station);

        const map = mapInstanceRef.current;
        if (map) {
          if (isWithinCampusBounds(latitude, longitude)) {
            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
            }
            const userIcon = L.divIcon({
              className: 'sau-user-loc-icon',
              html: '<div class="sau-user-dot"><span class="sau-user-pulse"></span></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11]
            });
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: userIcon
            }).addTo(map);
            map.flyTo([latitude, longitude], 17, { duration: 0.65 });
            setLocationStatus(`En yakın: ${nearest.station.title}`);
          } else {
            map.flyTo([nearest.station.lat, nearest.station.lng], 16, { duration: 0.65 });
            setLocationStatus('Kampüs dışındasınız · Esentepe gösteriliyor');
          }
        }
        setTimeout(() => setLocationStatus(null), 2800);
      },
      () => {
        setLocationStatus('Konum izni kapalı.');
        handleResetCampusView();
        setTimeout(() => setLocationStatus(null), 2400);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const selectedDistanceLabel =
    selectedStation && userCoords
      ? formatWalkingEstimate(
          calculateDistanceMeters(
            userCoords.lat,
            userCoords.lng,
            selectedStation.lat,
            selectedStation.lng
          )
        )
      : null;

  return (
    <div className="sau-map-page">
      <div className="sau-compact-head">
        <h2 className="sau-compact-title">Atık Haritası</h2>
        <span className="sau-compact-meta">Esentepe · 1.200 Kutu</span>
      </div>

      <div className="sau-filter-strip" role="tablist" aria-label="Atık türü filtresi">
        {FILTER_OPTIONS.map((item) => {
          const isActive = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`sau-filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFilter(item.id)}
            >
              <span
                className="sau-chip-dot"
                style={{ backgroundColor: item.dotColor }}
              />
              <span className="sau-chip-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="sau-map-shell">
        <div className="sau-map-controls">
          <button
            type="button"
            className="sau-map-ctrl-btn"
            onClick={handleLocateUser}
            aria-label="Konumumu bul"
          >
            <Icon name="locate" size={16} />
            <span>Konum</span>
          </button>
          <button
            type="button"
            className="sau-map-ctrl-btn sau-map-ctrl-btn-muted"
            onClick={handleResetCampusView}
            aria-label="Kampüs merkezine dön"
          >
            <Icon name="map-pin" size={15} />
            <span>Kampüs</span>
          </button>
        </div>

        {locationStatus && (
          <div className="sau-map-status-pill" role="status">
            {locationStatus}
          </div>
        )}

        <div
          ref={mapContainerRef}
          className="sau-leaflet-canvas"
          aria-label="Sakarya Üniversitesi Esentepe Kampüsü Atık Haritası"
        />
      </div>

      {selectedStation && (
        <article className="sau-station-sheet" aria-label="Seçili nokta">
          <div className="sau-sheet-head">
            <div className="sau-sheet-title-wrap">
              <h3 className="sau-sheet-title">{selectedStation.title}</h3>
              <span className="sau-unit-pill">{selectedStation.unitCount} ünite</span>
              {selectedDistanceLabel && (
                <span className="sau-distance-pill">{selectedDistanceLabel}</span>
              )}
            </div>
            <button
              type="button"
              className="sau-sheet-close"
              onClick={() => setSelectedStation(null)}
              aria-label="Kapat"
            >
              <Icon name="close" size={15} />
            </button>
          </div>

          <p className="sau-sheet-desc">{selectedStation.locationDetail}</p>

          <div className="sau-streams-compact">
            {selectedStation.streams.map((streamKey) => {
              const meta = WASTE_STREAM_META[streamKey];
              return (
                <div
                  key={streamKey}
                  className="sau-stream-pill"
                  style={{ backgroundColor: meta.bgColor }}
                >
                  <span
                    className="sau-stream-dot"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="sau-stream-pill-text">
                    {COMPACT_STREAM_SHORT[streamKey]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="sau-sheet-actions">
            <button
              type="button"
              className="sau-sheet-btn sau-sheet-btn-solid"
              onClick={() => onStartVerification?.(selectedStation)}
            >
              <Icon name="camera" size={16} />
              <span>Doğrula</span>
            </button>
            <a
              className="sau-sheet-btn sau-sheet-btn-soft"
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="arrow-right" size={16} />
              <span>Yol Tarifi</span>
            </a>
          </div>
        </article>
      )}
    </div>
  );
};

export default CampusWasteMap;
