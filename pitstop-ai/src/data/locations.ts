/**
 * Sample localisation values. These are round-number demo assumptions, NOT live prices or
 * current regulations. The UI labels them "sample" wherever they appear.
 */
export interface StateRecord {
  code: string;
  name: string;
  cities: string[];
  petrolPerLitre: number;
  dieselPerLitre: number;
  cngPerKg: number;
  homeTariffPerKwh: number;
  publicTariffPerKwh: number;
  onRoadLoadingPct: number;
}

export const INDIA_WIDE_DEFAULTS = {
  petrolPerLitre: 100,
  dieselPerLitre: 90,
  cngPerKg: 85,
  homeTariffPerKwh: 7.5,
  publicTariffPerKwh: 18,
  onRoadLoadingPct: 18,
} as const;

export const STATES: StateRecord[] = [
  { code: "MH", name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur"], petrolPerLitre: 104, dieselPerLitre: 91, cngPerKg: 85, homeTariffPerKwh: 9, publicTariffPerKwh: 20, onRoadLoadingPct: 20 },
  { code: "KA", name: "Karnataka", cities: ["Bengaluru", "Mysuru"], petrolPerLitre: 102, dieselPerLitre: 89, cngPerKg: 85, homeTariffPerKwh: 7, publicTariffPerKwh: 18, onRoadLoadingPct: 24 },
  { code: "DL", name: "Delhi NCR", cities: ["New Delhi", "Gurugram", "Noida"], petrolPerLitre: 95, dieselPerLitre: 88, cngPerKg: 85, homeTariffPerKwh: 6.5, publicTariffPerKwh: 16, onRoadLoadingPct: 14 },
  { code: "TN", name: "Tamil Nadu", cities: ["Chennai", "Coimbatore"], petrolPerLitre: 101, dieselPerLitre: 92, cngPerKg: 85, homeTariffPerKwh: 6, publicTariffPerKwh: 17, onRoadLoadingPct: 17 },
  { code: "TG", name: "Telangana", cities: ["Hyderabad"], petrolPerLitre: 108, dieselPerLitre: 96, cngPerKg: 85, homeTariffPerKwh: 7.5, publicTariffPerKwh: 18, onRoadLoadingPct: 16 },
  { code: "GJ", name: "Gujarat", cities: ["Ahmedabad", "Surat"], petrolPerLitre: 96, dieselPerLitre: 92, cngPerKg: 85, homeTariffPerKwh: 7, publicTariffPerKwh: 17, onRoadLoadingPct: 12 },
  { code: "WB", name: "West Bengal", cities: ["Kolkata"], petrolPerLitre: 105, dieselPerLitre: 92, cngPerKg: 85, homeTariffPerKwh: 8, publicTariffPerKwh: 19, onRoadLoadingPct: 15 },
  { code: "KL", name: "Kerala", cities: ["Kochi", "Thiruvananthapuram"], petrolPerLitre: 107, dieselPerLitre: 96, cngPerKg: 85, homeTariffPerKwh: 6.5, publicTariffPerKwh: 18, onRoadLoadingPct: 22 },
  { code: "RJ", name: "Rajasthan", cities: ["Jaipur", "Udaipur"], petrolPerLitre: 105, dieselPerLitre: 90, cngPerKg: 85, homeTariffPerKwh: 7.5, publicTariffPerKwh: 18, onRoadLoadingPct: 15 },
  { code: "UP", name: "Uttar Pradesh", cities: ["Lucknow", "Kanpur"], petrolPerLitre: 95, dieselPerLitre: 88, cngPerKg: 85, homeTariffPerKwh: 7, publicTariffPerKwh: 17, onRoadLoadingPct: 13 },
];

export function findState(code: string): StateRecord | undefined {
  return STATES.find((s) => s.code === code);
}
