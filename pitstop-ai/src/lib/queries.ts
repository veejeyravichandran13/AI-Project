"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { CatalogueFilters } from "@/types/car";
import type { OwnershipAssumptions } from "@/types/ownership";
import type { Requirements } from "@/types/recommendation";
import {
  getBrand,
  getCarById,
  getCarFit,
  getCars,
  getCatalogue,
  getComparisonData,
  getDiscoveryOptions,
  getOwnershipComparison,
  getRecommendations,
  type Pick,
} from "@/lib/mock-api";

export type { Pick };

export const useDiscoveryOptions = () => useQuery({ queryKey: ["discovery-options"], queryFn: getDiscoveryOptions });
export const useCatalogue = () => useQuery({ queryKey: ["catalogue"], queryFn: getCatalogue, staleTime: Infinity });
export const useCars = (filters: CatalogueFilters = {}) =>
  useQuery({ queryKey: ["cars", filters], queryFn: () => getCars(filters), placeholderData: keepPreviousData });
export const useCar = (id: string) => useQuery({ queryKey: ["car", id], queryFn: () => getCarById(id) });
export const useBrand = (slug: string) => useQuery({ queryKey: ["brand", slug], queryFn: () => getBrand(slug) });

export const useRecommendations = (req: Requirements | null) =>
  useQuery({
    queryKey: ["recommendations", req],
    queryFn: () => getRecommendations(req as Requirements),
    enabled: req !== null,
  });

export const useCarFit = (carId: string, req: Requirements | null, optionId?: string | null) =>
  useQuery({
    queryKey: ["fit", carId, optionId ?? null, req],
    queryFn: () => getCarFit(carId, req as Requirements, optionId),
    enabled: req !== null,
  });

export const useComparisonData = (picks: Pick[], assumptions: OwnershipAssumptions, req: Requirements | null) =>
  useQuery({
    queryKey: ["comparison", picks, assumptions, req],
    queryFn: () => getComparisonData(picks, assumptions, req),
    enabled: picks.length > 0,
    placeholderData: keepPreviousData,
  });

export const useOwnershipComparison = (picks: Pick[], assumptions: OwnershipAssumptions) =>
  useQuery({
    queryKey: ["ownership", picks, assumptions],
    queryFn: () => getOwnershipComparison(picks, assumptions),
    enabled: picks.length > 0,
    placeholderData: keepPreviousData,
  });
