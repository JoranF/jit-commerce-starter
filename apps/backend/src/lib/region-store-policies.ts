/**
 * Store policy values kept in each region's `metadata`. The storefront renders
 * the shipping/returns pages and structured data from these keys, and merchants
 * can change them in Settings → Regions → Metadata.
 */
export type RegionStorePolicies = {
  return_window_days: number;
  free_returns: boolean;
  shipping_rate: number;
  handling_days_min: number;
  handling_days_max: number;
  transit_days_min: number;
  transit_days_max: number;
};

export const DEFAULT_REGION_STORE_POLICIES: RegionStorePolicies = {
  // NL: wettelijk minimaal 14 dagen herroepingsrecht. Ruimer mag (bv. 30).
  return_window_days: 14,
  free_returns: false,
  shipping_rate: 4.95,
  handling_days_min: 0,
  handling_days_max: 1,
  transit_days_min: 1,
  transit_days_max: 2,
};
