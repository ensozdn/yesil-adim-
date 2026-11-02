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
  SAU_CAMPUS_CENTER,
  WASTE_STREAM_META
} from '../services/campusWasteLocationsService';
import { Icon } from './Icon';

interface FilterOption {
  id: WasteFilterType;
  label: string;
  sublabel: string;
  dotColor: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'all',
    label: 'Tümü',
    sublabel: '3+1 Sistem',
    dotColor: '#23633f'
  },
  {
    id: 'packaging',
    label: 'Sarı Poşet',
    sublabel: 'Plastik · Cam · Metal',
    dotColor: '#c98a09'
  },
  {
    id: 'paper',
    label: 'Mavi Poşet',
    sublabel: 'Kâğıt ve Karton',
    dotColor: '#1e6bb8'
  },
  {
    id: 'battery',
    label: 'Atık Pil',
    sublabel: 'Bina Girişleri',
    dotColor: '#b9382c'
  },
  {
    id: 'domestic',
    label: 'Koyu Gri Poşet',
    sublabel: 'Diğer · Evsel',
    dotColor: '#4a5550'
  }
];

const getMarkerColor = (filter: WasteFilterType): string => {
  if (filter === 'all') return '#23633f';
  return WASTE_STREAM_META[filter].color;
};

const getMarkerSvgMarkup = (filter: WasteFilterType, isSelected: boolean): string => {
  const bg = getMarkerColor(filter);
  const size = isSelected ? 42 : 34;
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${innerIcon}
      </svg>
      <span class="sau-pin-tri-dots">
        <i style="background:#f2b705"></i>
        <i style="background:#2b82d9"></i>
        <i style="background:#e04f43"></i>
      </span>
    </div>
  `;
};

export const CampusWasteMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeFilter, setActiveFilter] = useState<WasteFilterType>('all');
  const [selectedStation, setSelectedStation] = useState<CampusWasteStation | null>(
    CAMPUS_WASTE_STATIONS[0]
  );
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const filteredStations = CAMPUS_WASTE_STATIONS.filter((station) =>
    activeFilter === 'all' ? true : station.streams.includes(activeFilter)
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SAU_CAMPUS_CENTER,
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

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
      const size = isSelected ? 42 : 34;

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
          duration: 0.55
        });
      });
      marker.addTo(layer);
    });
  }, [activeFilter, selectedStation, filteredStations]);

  const handleFocusStation = (station: CampusWasteStation) => {
    setSelectedStation(station);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([station.lat, station.lng], 17, { duration: 0.6 });
    }
  };

  const handleResetCampusView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo(SAU_CAMPUS_CENTER, 16, { duration: 0.6 });
    }
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Tarayıcınız konum özelliğini desteklemiyor.');
      setTimeout(() => setLocationStatus(null), 3200);
      return;
    }

    setLocationStatus('Konumunuz alınıyor...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (map) {
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
          map.flyTo([latitude, longitude], 17, { duration: 0.7 });
        }
        setLocationStatus('Konumunuz haritada işaretlendi.');
        setTimeout(() => setLocationStatus(null), 3000);
      },
      () => {
        setLocationStatus('Konum izni alınamadı. Kampüs merkezi gösteriliyor.');
        handleResetCampusView();
        setTimeout(() => setLocationStatus(null), 3200);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const renderStreamBadge = (streamKey: WasteStreamType) => {
    const meta = WASTE_STREAM_META[streamKey];
    return (
      <div
        key={streamKey}
        className="sau-stream-card"
        style={{ backgroundColor: meta.bgColor }}
      >
        <div className="sau-stream-top">
          <span
            className="sau-stream-dot"
            style={{ backgroundColor: meta.color }}
          />
          <span className="sau-stream-bag" style={{ color: meta.color }}>
            {meta.bagLabel}
          </span>
        </div>
        <strong className="sau-stream-name">{meta.label}</strong>
      </div>
    );
  };

  return (
    <div className="sau-map-page">
      <div className="eyebrow">SAÜ SIFIR ATIK YÖNETMELİĞİ · ESENTEPE KAMPÜSÜ</div>
      <h1>
        Kampüs atık
        <br />
        haritası.
      </h1>
      <p>
        Binalardaki 1.200 adet 3 bölmeli ayrıştırma kutusunu ve her bina girişindeki atık pil noktalarını harita üzerinde incele.
      </p>

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
              <span className="sau-chip-text">
                <strong>{item.label}</strong>
                <small>{item.sublabel}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="sau-map-shell">
        <div className="sau-map-floating-badge">
          <Icon name="recycle" size={14} />
          <span>1.200 Kutu · {filteredStations.length} Ana Nokta</span>
        </div>

        <div className="sau-map-controls">
          <button
            type="button"
            className="sau-map-ctrl-btn"
            onClick={handleLocateUser}
            aria-label="Konumumu bul"
          >
            <Icon name="locate" size={18} />
            <span>Konumum</span>
          </button>
          <button
            type="button"
            className="sau-map-ctrl-btn secondary"
            onClick={handleResetCampusView}
            aria-label="Kampüs merkezine dön"
          >
            <Icon name="map-pin" size={17} />
            <span>Esentepe</span>
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
          aria-label="Sakarya Üniversitesi Esentepe Kampüsü Atık Kutuları Haritası"
        />
      </div>

      <div className="sau-station-pills" aria-label="Hızlı bina seçimi">
        {filteredStations.map((station) => {
          const isCurrent = selectedStation?.id === station.id;
          return (
            <button
              key={station.id}
              type="button"
              className={`sau-station-pill ${isCurrent ? 'active' : ''}`}
              onClick={() => handleFocusStation(station)}
            >
              <Icon name="map-pin" size={14} />
              <span>{station.title}</span>
            </button>
          );
        })}
      </div>

      {selectedStation && (
        <article className="sau-station-sheet" aria-label="Seçili atık noktası detayı">
          <div className="sau-sheet-handle" aria-hidden="true" />

          <div className="sau-sheet-head">
            <div className="sau-sheet-badges">
              <span className="sau-zone-pill">{selectedStation.zone}</span>
              <span className="sau-unit-pill">
                {selectedStation.unitCount} Ünite Aktif
              </span>
            </div>
            <button
              type="button"
              className="sau-sheet-close"
              onClick={() => setSelectedStation(null)}
              aria-label="Detay kartını kapat"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <h2 className="sau-sheet-title">{selectedStation.title}</h2>
          <p className="sau-sheet-desc">{selectedStation.locationDetail}</p>

          <div className="sau-streams-grid">
            {selectedStation.streams.map((streamKey) => renderStreamBadge(streamKey))}
          </div>

          <div className="sau-sheet-actions">
            <button
              type="button"
              className="sau-sheet-btn primary"
              onClick={() => handleFocusStation(selectedStation)}
            >
              <Icon name="locate" size={17} />
              <span>Haritada Yaklaş</span>
            </button>
            <a
              className="sau-sheet-btn secondary"
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="arrow-right" size={17} />
              <span>Yürüyüş Rotası</span>
            </a>
          </div>
        </article>
      )}
    </div>
  );
};

export default CampusWasteMap;
