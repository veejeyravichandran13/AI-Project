import raw from "@/data/generated/catalogue.json";
import type { Catalogue } from "@/types/car";

/**
 * Build-time access to the catalogue for statically rendered pages (home, brand pages, sitemap).
 * Interactive screens go through the async service in lib/mock-api instead.
 */
export const staticCatalogue = raw as unknown as Catalogue;
