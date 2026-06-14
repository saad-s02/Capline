// UNVERIFIED: compiles and builds, but not yet run against a live map / Supabase. Verify in a browser.

export interface ViewState {
  pitch: number;
  bearing: number;
}

// compareMode approximates an orthographic top-down "compare" view —
// pitch 0 flattens the 3-D extrusions so relative heights read clearly side-by-side.
export function compareMode(): ViewState {
  return { pitch: 0, bearing: 0 };
}

export function defaultCity(): ViewState {
  return { pitch: 50, bearing: -20 };
}
