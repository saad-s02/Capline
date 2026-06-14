// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.
import type { LayerProps } from "react-map-gl/maplibre";

export const companyExtrusion: LayerProps = {
  id: "companies-3d",
  type: "fill-extrusion",
  source: "companies",
  "source-layer": "companies",
  paint: {
    "fill-extrusion-height": ["get", "height"],
    "fill-extrusion-base": 0,
    "fill-extrusion-color": ["get", "color"],
    "fill-extrusion-opacity": 0.92,
  },
};
