"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Requirements } from "@/types/recommendation";
import type { OwnershipAssumptions } from "@/types/ownership";
import { DEFAULT_REQUIREMENTS } from "@/data/discovery-options";
import { MAX_COMPARE } from "@/lib/constants";
import { defaultAssumptions } from "@/lib/calculations/ownership";

export type AddResult = "added" | "duplicate" | "full";

interface AppState {
  hydrated: boolean;
  /** Live questionnaire answers; preserved across back navigation and edits. */
  answers: Requirements;
  /** Requirements the user confirmed on the review step; recommendations are generated from these. */
  submitted: Requirements | null;
  discoveryStep: number;
  compareIds: string[];
  shortlistIds: string[];
  optionByCar: Record<string, string>;
  /** Cost Lab edits layered over defaults derived from the confirmed requirements. */
  assumptionOverrides: Partial<OwnershipAssumptions>;
  /** Demo control: make every mock request fail so error and retry states can be exercised. */
  simulateFailure: boolean;

  setAnswers: (a: Requirements) => void;
  setDiscoveryStep: (n: number) => void;
  submitRequirements: (r: Requirements) => void;
  addToCompare: (id: string) => AddResult;
  addManyToCompare: (ids: string[]) => { added: number; skipped: number };
  removeFromCompare: (id: string) => void;
  replaceInCompare: (oldId: string, newId: string) => void;
  moveInCompare: (id: string, direction: -1 | 1) => void;
  clearCompare: () => void;
  toggleShortlist: (id: string) => boolean;
  setOption: (carId: string, optionId: string) => void;
  setAssumptionOverrides: (patch: Partial<OwnershipAssumptions>) => void;
  resetAssumptions: () => void;
  setSimulateFailure: (v: boolean) => void;
  resetSession: () => void;
}

const initial = {
  answers: DEFAULT_REQUIREMENTS,
  submitted: null as Requirements | null,
  discoveryStep: 0,
  compareIds: [] as string[],
  shortlistIds: [] as string[],
  optionByCar: {} as Record<string, string>,
  assumptionOverrides: {} as Partial<OwnershipAssumptions>,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,
      simulateFailure: false,

      setAnswers: (answers) => set({ answers }),
      setDiscoveryStep: (discoveryStep) => set({ discoveryStep }),
      submitRequirements: (submitted) =>
        // New requirements change the defaults behind the cost assumptions, so drop stale edits.
        set({ submitted, answers: submitted, assumptionOverrides: {} }),

      addToCompare: (id) => {
        const { compareIds } = get();
        if (compareIds.includes(id)) return "duplicate";
        if (compareIds.length >= MAX_COMPARE) return "full";
        set({ compareIds: [...compareIds, id] });
        return "added";
      },
      addManyToCompare: (ids) => {
        const next = [...get().compareIds];
        let added = 0;
        let skipped = 0;
        for (const id of ids) {
          if (next.includes(id)) continue;
          if (next.length >= MAX_COMPARE) {
            skipped += 1;
            continue;
          }
          next.push(id);
          added += 1;
        }
        set({ compareIds: next });
        return { added, skipped };
      },
      removeFromCompare: (id) => set({ compareIds: get().compareIds.filter((x) => x !== id) }),
      replaceInCompare: (oldId, newId) => {
        const { compareIds } = get();
        if (compareIds.includes(newId)) return;
        set({ compareIds: compareIds.map((x) => (x === oldId ? newId : x)) });
      },
      moveInCompare: (id, direction) => {
        const ids = [...get().compareIds];
        const i = ids.indexOf(id);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= ids.length) return;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        set({ compareIds: ids });
      },
      clearCompare: () => set({ compareIds: [] }),

      toggleShortlist: (id) => {
        const { shortlistIds } = get();
        const saved = !shortlistIds.includes(id);
        set({ shortlistIds: saved ? [...shortlistIds, id] : shortlistIds.filter((x) => x !== id) });
        return saved;
      },
      setOption: (carId, optionId) => set({ optionByCar: { ...get().optionByCar, [carId]: optionId } }),
      setAssumptionOverrides: (patch) => {
        // An explicit `undefined` clears that override so the derived default applies again.
        const next: Partial<OwnershipAssumptions> = { ...get().assumptionOverrides, ...patch };
        for (const key of Object.keys(next) as (keyof OwnershipAssumptions)[]) {
          if (next[key] === undefined) delete next[key];
        }
        set({ assumptionOverrides: next });
      },
      resetAssumptions: () => set({ assumptionOverrides: {} }),
      setSimulateFailure: (simulateFailure) => set({ simulateFailure }),
      resetSession: () => set({ ...initial, discoveryStep: 0 }),
    }),
    {
      name: "pitstop-ai-session-v2",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually after mount so server and first client render agree.
      skipHydration: true,
      partialize: (s) => ({
        answers: s.answers,
        submitted: s.submitted,
        compareIds: s.compareIds,
        shortlistIds: s.shortlistIds,
        optionByCar: s.optionByCar,
        assumptionOverrides: s.assumptionOverrides,
      }),
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Effective Cost Lab assumptions: defaults from the confirmed requirements plus user edits. */
export function selectAssumptions(s: Pick<AppState, "submitted" | "assumptionOverrides">): OwnershipAssumptions {
  const base = defaultAssumptions(s.submitted);
  // A state edit must re-base the fuel and tariff defaults before other edits are applied.
  const stateCode = s.assumptionOverrides.stateCode;
  const rebased = stateCode !== undefined ? defaultAssumptions(s.submitted, stateCode) : base;
  return { ...rebased, ...s.assumptionOverrides, maintenancePerKm: { ...rebased.maintenancePerKm, ...s.assumptionOverrides.maintenancePerKm } };
}
