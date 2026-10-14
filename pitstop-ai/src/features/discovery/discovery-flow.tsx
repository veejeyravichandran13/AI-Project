"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import type { Requirements } from "@/types/recommendation";
import { requirementsSchema, STEP_FIELDS } from "@/lib/validation/requirements";
import { useAppStore } from "@/store/use-app-store";
import { useDiscoveryOptions } from "@/lib/queries";
import { inferBuyerContext } from "@/lib/calculations/context";
import { BudgetRangeSlider } from "@/components/forms/budget-range-slider";
import { SelectField } from "@/components/forms/select-field";
import { MultiSelectField } from "@/components/forms/multi-select-field";
import { LocationField } from "@/components/forms/location-field";
import { FieldShell, controlClass, describedBy } from "@/components/forms/field-shell";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/feedback/loading-skeleton";
import { ErrorState } from "@/components/feedback/states";
import { RequirementsSummary } from "./requirements-summary";
import { LiveMatches } from "./live-matches";
import { track } from "@/lib/analytics";
import { Chip } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { KM_BOUNDS } from "@/lib/constants";

const STEPS = ["Budget and body", "Seats and fuel", "What matters", "How you drive", "Where you live", "Review"];
const REVIEW = STEPS.length - 1;

const STEP_COPY = [
  { title: "What can you spend, and what shape of car do you picture?", lead: "Set a realistic ex-showroom range. We will only suggest cars inside it." },
  { title: "Who rides along, and what powers the car?", lead: "Seating and fuel are firm requirements: we will not suggest cars that miss them." },
  { title: "What matters most to you?", lead: "Choose up to three priorities. Each one is scored from published figures, not opinions." },
  { title: "How will you actually use it?", lead: "Real driving patterns matter more than brochure figures, especially for running costs." },
  { title: "Where will you drive it?", lead: "Optional. Your state tunes fuel, electricity and on-road price assumptions." },
  { title: "Check your brief", lead: "Review your answers. You can change anything before we build your shortlist." },
];

export function DiscoveryFlow() {
  const hydrated = useAppStore((s) => s.hydrated);
  if (!hydrated) {
    return (
      <div role="status" aria-busy="true" className="space-y-4">
        <span className="sr-only">Loading your saved answers…</span>
        <Skeleton className="h-6 w-1/3" /><Skeleton className="h-64" />
      </div>
    );
  }
  return <Flow />;
}

function Flow() {
  const router = useRouter();
  const answers = useAppStore((s) => s.answers);
  const step = useAppStore((s) => s.discoveryStep);
  const setStep = useAppStore((s) => s.setDiscoveryStep);
  const setAnswers = useAppStore((s) => s.setAnswers);
  const submit = useAppStore((s) => s.submitRequirements);
  const options = useDiscoveryOptions();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [direction, setDirection] = useState(1);

  const form = useForm<Requirements>({ resolver: zodResolver(requirementsSchema) as never, defaultValues: answers, mode: "onChange" });
  const { control, trigger, getValues, formState: { errors } } = form;
  const values = useWatch({ control }) as Requirements;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, [step]);

  const persist = () => {
    const v = getValues();
    setAnswers({ ...v, annualKm: Number.isFinite(v.annualKm) ? v.annualKm : answers.annualKm });
  };
  const go = (next: number) => {
    persist();
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onContinue = async () => {
    if (await trigger(STEP_FIELDS[step])) go(step + 1);
  };
  const onSubmit = form.handleSubmit((data) => {
    submit(data);
    track({ name: "discovery_submitted" });
    router.push("/recommendations");
  });

  if (options.isError) return <ErrorState title="Could not load the questionnaire options" message={options.error.message} onRetry={() => void options.refetch()} busy={options.isFetching} />;
  if (!options.data) {
    return (
      <div role="status" aria-busy="true" className="space-y-4"><span className="sr-only">Loading questions…</span><Skeleton className="h-6 w-1/3" /><Skeleton className="h-72" /></div>
    );
  }
  const o = options.data;
  const evPossible = values.powertrain === "ev" || values.powertrain === "any";
  const copy = STEP_COPY[step];
  const valid = requirementsSchema.safeParse(values).success;
  const context = step === REVIEW && valid ? inferBuyerContext(values) : [];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <form
        onSubmit={(e) => {
          if (step < REVIEW) {
            e.preventDefault();
            void onContinue();
          } else void onSubmit(e);
        }}
        noValidate
        className="min-w-0 space-y-8"
      >
        <ProgressIndicator steps={STEPS} current={step} />
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div key={step} custom={direction} initial={{ opacity: 0, x: direction * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -28 }} transition={{ duration: 0.22 }}>
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl font-semibold leading-tight outline-none sm:text-4xl">{copy.title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{copy.lead}</p>
            <div className="mt-8 space-y-8">
              {step === 0 ? (
                <>
                  <Controller control={control} name="budgetMinLakh" render={() => (
                    <BudgetRangeSlider min={values.budgetMinLakh} max={values.budgetMaxLakh} error={errors.budgetMinLakh?.message ?? errors.budgetMaxLakh?.message} onChange={(lo, hi) => { form.setValue("budgetMinLakh", lo, { shouldValidate: true }); form.setValue("budgetMaxLakh", hi, { shouldValidate: true }); }} />
                  )} />
                  <Controller control={control} name="vehicleType" render={({ field, fieldState }) => <SelectField id="vehicleType" label="Body style" value={field.value} onChange={field.onChange} options={o.vehicleTypes} error={fieldState.error?.message} />} />
                </>
              ) : null}
              {step === 1 ? (
                <>
                  <Controller control={control} name="minSeats" render={({ field, fieldState }) => <SelectField id="minSeats" label="How many people do you need to seat?" value={field.value} onChange={field.onChange} options={o.seating} error={fieldState.error?.message} hint="We only suggest cars with at least this many seats." />} />
                  <Controller control={control} name="powertrain" render={({ field, fieldState }) => <SelectField id="powertrain" label="Fuel / powertrain" value={field.value} onChange={field.onChange} options={o.powertrains} error={fieldState.error?.message} hint="Choose “Open to any” to weigh petrol, diesel, CNG, hybrid and electric together." />} />
                  {evPossible ? (
                    <Controller control={control} name="chargingAccess" render={({ field, fieldState }) => <SelectField id="chargingAccess" label="Could you charge an EV where you park?" value={field.value} onChange={field.onChange} options={o.charging} error={fieldState.error?.message} hint="Why we ask: an EV is cheap to run mainly when you can charge at home or work. “No reliable charging access” rules EVs out if you are open to any fuel." />} />
                  ) : null}
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <Controller control={control} name="preferences" render={({ field, fieldState }) => <MultiSelectField id="preferences" label="Your priorities" values={field.value} onChange={field.onChange} options={o.preferences} max={3} error={fieldState.error?.message} hint="Optional. Leave empty for a balanced view." placeholder="Pick up to three" />} />
                  <Controller control={control} name="brand" render={({ field, fieldState }) => <SelectField id="brand" label="Manufacturer" optional value={field.value} onChange={field.onChange} options={o.brands} error={fieldState.error?.message} hint="A soft preference: we favour this maker where it fits your firm requirements, but may still show others." />} />
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <Controller control={control} name="usage" render={({ field, fieldState }) => <SelectField id="usage" label="Where do you mostly drive?" value={field.value} onChange={field.onChange} options={o.usage} error={fieldState.error?.message} />} />
                  <Controller control={control} name="annualKm" render={({ field, fieldState }) => {
                    const err = fieldState.error?.message;
                    const hint = "Why we ask: yearly distance drives fuel or charging cost. City commuters often do 8,000–12,000 km; frequent highway drivers 20,000 or more.";
                    return (
                      <FieldShell id="annualKm" label="Kilometres you expect to drive each year" hint={hint} error={err}>
                        <input id="annualKm" type="number" inputMode="numeric" min={KM_BOUNDS.min} max={KM_BOUNDS.max} step={500} value={Number.isFinite(field.value) ? field.value : ""} onChange={(e) => field.onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))} onBlur={field.onBlur} aria-invalid={err ? true : undefined} aria-describedby={describedBy("annualKm", hint, err)} className={cn(controlClass, "tabular-nums")} />
                        <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Quick picks for yearly distance">
                          {[6000, 10000, 15000, 20000, 30000].map((km) => (
                            <button key={km} type="button" onClick={() => field.onChange(km)} aria-pressed={field.value === km} className={cn("min-h-10 rounded-full border border-line px-4 text-sm hover:bg-surface-2", field.value === km && "border-accent bg-accent-soft text-accent")}>{km.toLocaleString("en-IN")} km</button>
                          ))}
                        </div>
                      </FieldShell>
                    );
                  }} />
                  <Controller control={control} name="ownership" render={({ field, fieldState }) => <SelectField id="ownership" label="How long do you expect to keep the car?" value={field.value} onChange={field.onChange} options={o.ownership} error={fieldState.error?.message} hint="Longer horizons favour safety and efficiency; shorter ones favour performance." />} />
                </>
              ) : null}
              {step === 4 ? (
                <>
                  <LocationField stateCode={values.stateCode} city={values.city} stateError={errors.stateCode?.message} cityError={errors.city?.message} onChange={({ stateCode, city }) => { form.setValue("stateCode", stateCode, { shouldValidate: true }); form.setValue("city", city, { shouldValidate: true }); }} />
                  <p className="rounded-2xl bg-surface-2 p-4 text-sm leading-6 text-muted">Skipping is fine. Without a location we use clearly labelled India-wide sample estimates. Location is stored only in this browser.</p>
                </>
              ) : null}
              {step === REVIEW ? (
                <>
                  <RequirementsSummary requirements={values} onEdit={go} />
                  {context.length > 0 ? (
                    <section aria-label="Inferred buyer context" className="rounded-3xl border border-line bg-surface p-5">
                      <h3 className="font-display text-lg font-semibold">What your answers suggest</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">Patterns we noticed, shown for transparency. They are not used to rank cars.</p>
                      <ul className="mt-3 flex flex-wrap gap-2">{context.map((c) => <li key={c.label}><Chip>{c.label}</Chip></li>)}</ul>
                      <ul className="mt-3 space-y-1 text-sm text-muted">{context.map((c) => <li key={c.label}>{c.label}: {c.reason}.</li>)}</ul>
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="glass sticky bottom-[4.75rem] z-20 -mx-4 flex items-center justify-between gap-3 px-4 py-3 sm:mx-0 sm:rounded-3xl sm:px-5 lg:bottom-4">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}><ArrowLeft size={18} /> Back</Button>
          {step < REVIEW ? (
            <Button onClick={() => void onContinue()}>{step === 4 ? "Review answers" : "Continue"} <ArrowRight size={18} weight="bold" /></Button>
          ) : (
            <Button type="submit" size="lg"><MagnifyingGlass size={20} weight="bold" /> Find my five matches</Button>
          )}
        </div>
      </form>

      <aside aria-label="Live preview of matching cars" className="order-first lg:order-none">
        <div className="glass rounded-3xl p-5 lg:sticky lg:top-24">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Live preview</p>
          <LiveMatches values={values} />
        </div>
      </aside>
    </div>
  );
}
