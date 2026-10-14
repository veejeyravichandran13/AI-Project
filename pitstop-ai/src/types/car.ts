/**
 * Real-data domain model. Every factual value is a `Fact` carrying the id of the source it came
 * from, and each model lists its sources with URL and retrieval date. Unknown means `null`.
 */
export type Fuel = "petrol" | "diesel" | "cng" | "mild-hybrid" | "strong-hybrid" | "ev";
export type BodyType = "hatchback" | "sedan" | "compact-suv" | "suv" | "mpv" | "coupe" | "pickup";
export type Segment = "budget" | "mainstream" | "premium" | "luxury";

export interface Fact<T> {
  v: T;
  s: string;
}

export type SourceType = "manufacturer" | "brochure" | "ncap" | "wikipedia" | "third-party";

export interface Source {
  id: string;
  type: SourceType;
  label: string;
  publisher: string;
  url: string;
  retrievedAt: string;
  publishedAt: string | null;
}

export interface BrandLogo {
  path: string;
  file: string;
  filePageUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  trademark: boolean;
}

export interface Brand {
  name: string;
  slug: string;
  country: string;
  parent: string | null;
  indiaWebsite: string;
  wikipediaUrl: string | null;
  founded: Fact<number> | null;
  /** Official logo from Wikimedia Commons, or null (the UI then shows a text wordmark). */
  logo: BrandLogo | null;
  modelCount: number;
}

export interface Dimensions {
  lengthMm: Fact<number> | null;
  widthMm: Fact<number> | null;
  heightMm: Fact<number> | null;
  wheelbaseMm: Fact<number> | null;
  groundClearanceMm: Fact<number> | null;
  bootLitres: Fact<number> | null;
  fuelTankLitres: Fact<number> | null;
  kerbWeightKg: Fact<number> | null;
}

export interface Ncap {
  body: string;
  stars: number;
  adultOccupantStars: number | null;
  childOccupantStars: number | null;
  /** Null when the source did not state the test year. */
  year: number | null;
  protocol: string | null;
  s: string;
  note: string | null;
}

export interface Efficiency {
  value: number;
  unit: "km/l" | "km/kg" | "km/kWh";
  basis: string;
  s: string;
}

export interface EvSpec {
  batteryKwh: Fact<number> | null;
  claimedRangeKm: Fact<number> | null;
  rangeStandard: string | null;
  acChargeNote: Fact<string> | null;
  dcFastChargeNote: Fact<string> | null;
}

export interface Trim {
  name: string;
  priceInr: Fact<number> | null;
}

export interface Option {
  id: string;
  label: string;
  fuel: Fuel;
  engine: string;
  displacementCc: Fact<number> | null;
  cylinders: number | null;
  powerPs: Fact<number> | null;
  torqueNm: Fact<number> | null;
  transmission: string;
  efficiency: Efficiency | null;
  ev: EvSpec | null;
  fromPriceInr: Fact<number> | null;
  trims: Trim[];
}

export interface CarImage {
  file: string;
  localPath: string;
  thumbPath: string;
  filePageUrl: string;
  author: string;
  license: string;
  licenseUrl: string | null;
  caption: string;
  match: "exact" | "same-model-other-market" | "same-model-other-generation";
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  generation: string | null;
  bodyType: BodyType;
  seats: Fact<number>;
  summary: string;
  officialUrl: string;
  wikipediaUrl: string | null;
  dimensions: Dimensions;
  safety: {
    ncap: Ncap | null;
    airbagsStandard: Fact<number> | null;
    keyFeatures: string[];
  };
  warranty: Fact<string> | null;
  price: {
    minInr: Fact<number>;
    maxInr: Fact<number> | null;
    basis: string;
    location: string;
    asOf: string;
  };
  options: Option[];
  images: CarImage[];
  /** Path of the maker's official logo, or null when none has a free licence. Filled in by build-data. */
  brandLogo?: string | null;
  sources: Source[];
  notes: string[];
}

export interface Catalogue {
  generatedAt: string;
  brands: Brand[];
  models: Car[];
}

export interface CatalogueFilters {
  query?: string;
  brands?: string[];
  bodyTypes?: BodyType[];
  fuels?: Fuel[];
  minPriceInr?: number;
  maxPriceInr?: number;
  minSeats?: number;
  minNcapStars?: number;
}
