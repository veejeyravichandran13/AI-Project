/**
 * Local no-op analytics interface. Phase 1 collects and transmits nothing; this only fixes the
 * event vocabulary so a privacy-reviewed implementation can be dropped in later.
 */
export type ProductEvent =
  | { name: "discovery_started" }
  | { name: "discovery_submitted" }
  | { name: "recommendations_viewed"; count: number }
  | { name: "vehicle_viewed"; vehicleId: string }
  | { name: "compare_changed"; count: number }
  | { name: "cost_lab_viewed" };

export function track(event: ProductEvent): void {
  void event; // intentionally does nothing
}
