// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Source, Layer, Popup } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapRef, MapMouseEvent } from "react-map-gl/maplibre";
import { companyExtrusion } from "./layers";
import { getCompany } from "../data/api";
import type { Company } from "../data/types";
import { BuildingReadout } from "../ui/BuildingReadout";
import { compareMode, defaultCity } from "./cameras";

// NOTE: "https://demotiles.maplibre.org/style.json" is a placeholder dark-ish base style.
// Before launch, swap this for a self-hosted Protomaps dark style (e.g. "pmtiles://..." or a Protomaps tiles endpoint).
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const INITIAL_VIEW = {
  longitude: -79.3807,
  latitude: 43.648,
  zoom: 14,
  pitch: 50,
  bearing: -20,
};

interface PopupInfo {
  longitude: number;
  latitude: number;
  company: Company;
}

export function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);

  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  const handleClick = useCallback(async (event: MapMouseEvent) => {
    const features = event.features;
    const companyId = features?.[0]?.properties?.companyId as string | undefined;
    if (!companyId) {
      setPopupInfo(null);
      return;
    }
    const company = await getCompany(companyId);
    if (!company) return;
    setPopupInfo({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      company,
    });
  }, []);

  const handleClosePopup = useCallback(() => {
    setPopupInfo(null);
  }, []);

  const toggleCompareMode = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (isCompareMode) {
      const view = defaultCity();
      map.easeTo({ pitch: view.pitch, bearing: view.bearing, duration: 600 });
      setIsCompareMode(false);
    } else {
      const view = compareMode();
      map.easeTo({ pitch: view.pitch, bearing: view.bearing, duration: 600 });
      setIsCompareMode(true);
    }
  }, [isCompareMode]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        maxPitch={60}
        minZoom={11}
        maxZoom={18}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={["companies-3d"]}
        onClick={handleClick}
        style={{ width: "100%", height: "100%" }}
      >
        <Source
          id="companies"
          type="vector"
          url={`pmtiles://${import.meta.env.VITE_PMTILES_URL ?? ""}`}
        >
          <Layer {...companyExtrusion} />
        </Source>

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={handleClosePopup}
            closeButton={false}
            anchor="bottom"
            maxWidth="none"
          >
            <BuildingReadout company={popupInfo.company} onClose={handleClosePopup} />
          </Popup>
        )}
      </Map>

      <button
        onClick={toggleCompareMode}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(20,20,40,0.9)",
          color: "#e0e0e0",
          border: "1px solid #444",
          borderRadius: 6,
          padding: "6px 14px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          zIndex: 10,
        }}
      >
        {isCompareMode ? "3D View" : "Compare View"}
      </button>
    </div>
  );
}
