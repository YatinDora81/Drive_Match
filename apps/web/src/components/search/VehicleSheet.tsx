"use client";

import { useEffect, useId, useRef } from "react";
import { useVehicle } from "../../hooks/useVehicle";
import {
  formatInr,
  formatKm,
  groupIndian,
  labelEnum,
  plural,
  titleOf,
} from "../../lib/format";
import { FUEL_TONE, toneStyle } from "../../lib/tones";
import type { SearchFilters, Vehicle } from "../../lib/types";
import { violationsFor } from "../../lib/violations";
import { CloseIcon, WarningIcon } from "../icons";
import { IconButton } from "../ui/IconButton";
import { CarArt } from "./CarArt";
import { SafetyBadge } from "./SafetyBadge";

type Props = {
  seed: Vehicle;
  matchedFeatures: string[];
  requested: SearchFilters;
  onClose: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Row = { label: string; value: string | null };

function listedDate(createdAt: string): string | null {
  const listed = new Date(createdAt);
  if (Number.isNaN(listed.getTime())) return null;
  return listed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rowsFor(vehicle: Vehicle): Row[] {
  const isEv = vehicle.fuelType === "ELECTRIC";
  const unit = (value: number | null, suffix: string) =>
    value === null ? null : `${groupIndian(value)} ${suffix}`;

  return [
    { label: "Year", value: String(vehicle.year) },
    { label: "Driven", value: formatKm(vehicle.kmDriven) },
    {
      label: "Owners",
      value: `${vehicle.ownerCount} ${plural(vehicle.ownerCount, "owner")}`,
    },
    { label: "City", value: vehicle.city || null },
    { label: "Fuel", value: labelEnum(vehicle.fuelType) },
    { label: "Gearbox", value: labelEnum(vehicle.transmission) },
    { label: "Body", value: labelEnum(vehicle.bodyType) },
    { label: "Seats", value: String(vehicle.seats) },
    ...(isEv
      ? [
          { label: "Battery", value: unit(vehicle.batteryKwh, "kWh") },
          { label: "Range", value: unit(vehicle.rangeKm, "km") },
        ]
      : [
          { label: "Engine", value: unit(vehicle.engineCc, "cc") },
          { label: "Mileage", value: unit(vehicle.mileageKmpl, "kmpl") },
        ]),
    { label: "Power", value: unit(vehicle.powerBhp, "bhp") },
    { label: "Colour", value: vehicle.color || null },
    { label: "Registration", value: vehicle.registrationState || null },
  ];
}

export function VehicleSheet({ seed, matchedFeatures, requested, onClose }: Props) {
  const { data, isFetching, isError, isPlaceholderData } = useVehicle(
    seed.id,
    seed,
  );
  const vehicle = data ?? seed;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const panel = panelRef.current;
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.tabIndex !== -1);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  const matched = new Set(matchedFeatures);
  const violations = violationsFor(vehicle, requested);
  const listedText = listedDate(vehicle.createdAt);
  const rows = rowsFor(vehicle).filter(
    (row): row is { label: string; value: string } => row.value !== null,
  );

  return (
    <div className="fixed inset-0 z-[500]">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-scrim"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={toneStyle(FUEL_TONE[vehicle.fuelType])}
        className="animate-sheet-up absolute inset-x-2 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-panel bg-card shadow-sheet sm:animate-slide-in sm:inset-x-auto sm:inset-y-3 sm:right-3 sm:max-h-none sm:w-[450px] sm:rounded-panel"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line py-3 pr-3 pl-5">
          <h2
            id={titleId}
            className="min-w-0 truncate text-[16px] font-extrabold tracking-[-0.01em] text-ink"
          >
            {titleOf(vehicle)}
          </h2>
          <IconButton ref={closeRef} size="sm" label="Close details" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="grid h-40 place-items-center rounded-tile bg-[var(--tone-soft)] text-[var(--tone)]">
            <CarArt bodyType={vehicle.bodyType} className="w-[58%] max-w-[220px]" />
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[32px] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {formatInr(vehicle.price)}
              </div>
              <div className="mt-1.5 text-[12.5px] text-ink-3 tabular-nums">
                ₹{groupIndian(vehicle.price)}
              </div>
            </div>
            <SafetyBadge rating={vehicle.safetyRating} />
          </div>

          <p className="mt-3 text-[13.5px] text-ink-2">
            {[vehicle.variant, labelEnum(vehicle.fuelType), labelEnum(vehicle.transmission)]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {violations.length > 0 ? (
            <section
              aria-label="Against what you asked for"
              className="mt-4 rounded-tile border border-sun/30 bg-sun-soft p-4"
            >
              <h3 className="flex items-center gap-1.5 text-[13.5px] font-bold text-sun">
                <WarningIcon className="size-4 shrink-0" />
                Against what you asked for
              </h3>
              <ul className="mt-2 space-y-1">
                {violations.map((violation) => (
                  <li
                    key={violation.field}
                    className="flex items-start gap-2 text-[13.5px] text-ink-2"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-sun"
                    />
                    <span className="min-w-0 tabular-nums">{violation.caption}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <dl className="mt-4">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-[13.5px]"
              >
                <dt className="shrink-0 text-ink-3">{row.label}</dt>
                <dd className="min-w-0 truncate text-right font-bold text-ink tabular-nums">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {vehicle.description ? (
            <section className="mt-6" aria-labelledby={`${titleId}-about`}>
              <h3 id={`${titleId}-about`} className="text-[11.5px] font-bold text-ink-3">
                About this car
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                {vehicle.description}
              </p>
            </section>
          ) : null}

          <section className="mt-6" aria-labelledby={`${titleId}-features`}>
            <h3 id={`${titleId}-features`} className="text-[11.5px] font-bold text-ink-3">
              Features · <span className="tabular-nums">{vehicle.features.length}</span>
            </h3>
            {vehicle.features.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {vehicle.features.map((feature) => (
                  <li
                    key={feature}
                    className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${
                      matched.has(feature)
                        ? "bg-electric-soft text-electric"
                        : "bg-sunk text-ink-2"
                    }`}
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13.5px] text-ink-3">No features listed.</p>
            )}
          </section>

          <p className="mt-6 break-all font-mono text-[10.5px] text-ink-3">
            {vehicle.id}
            {listedText ? ` · listed ${listedText}` : ""}
            {isFetching && isPlaceholderData ? " · refreshing…" : ""}
          </p>
          {isError ? (
            <p role="status" className="mt-1 text-[12.5px] text-rose">
              Could not refresh this listing. Showing the copy from the search
              results.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
