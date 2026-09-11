"use client";

import { useEffect, useId, useRef } from "react";
import { useVehicle } from "../../hooks/useVehicle";
import { formatInr, formatKm, labelEnum, plural, titleOf } from "../../lib/format";
import type { Vehicle } from "../../lib/types";
import { CloseIcon } from "../icons";
import { IconButton } from "../ui/IconButton";
import { BodyGlyph } from "./BodyGlyph";
import { NcapStars } from "./NcapStars";

type Props = {
  seed: Vehicle;
  matchedFeatures: string[];
  onClose: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Fact({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[13px] text-ink">{value}</dd>
    </div>
  );
}

export function VehicleSheet({ seed, matchedFeatures, onClose }: Props) {
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
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.tabIndex !== -1);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || !panelRef.current.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !panelRef.current.contains(active))
      ) {
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

  const isEv = vehicle.fuelType === "ELECTRIC";
  const matched = new Set(matchedFeatures);
  const listed = new Date(vehicle.createdAt);
  const listedText = Number.isNaN(listed.getTime())
    ? null
    : listed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="fixed inset-0 z-[500]">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-black/20 dark:bg-black/55"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-pop absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-card shadow-sheet md:inset-y-3 md:right-3 md:rounded-card md:border md:border-line"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="text-[26px] font-bold leading-none tracking-[-0.025em] text-ink">
              {formatInr(vehicle.price)}
            </div>
            <h2
              id={titleId}
              className="mt-1.5 text-[16px] font-medium leading-[1.3] tracking-[-0.012em] text-ink"
            >
              {titleOf(vehicle)}
            </h2>
            <p className="text-[12.5px] text-body">{vehicle.variant}</p>
          </div>
          <IconButton ref={closeRef} label="Close details" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <BodyGlyph
            bodyType={vehicle.bodyType}
            color={vehicle.color}
            className="rounded-field border border-line"
          />

          <div className="mt-4 flex items-center gap-2 text-[12.5px] text-body">
            <NcapStars rating={vehicle.safetyRating} />
            <span>Global NCAP</span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Fact label="Fuel" value={labelEnum(vehicle.fuelType)} />
            <Fact label="Gearbox" value={labelEnum(vehicle.transmission)} />
            <Fact label="Body" value={labelEnum(vehicle.bodyType)} />
            <Fact label="Year" value={String(vehicle.year)} />
            <Fact label="Driven" value={formatKm(vehicle.kmDriven)} />
            <Fact
              label="Owners"
              value={`${vehicle.ownerCount} ${plural(vehicle.ownerCount, "owner")}`}
            />
            <Fact label="Seats" value={String(vehicle.seats)} />
            {isEv ? (
              <>
                <Fact
                  label="Battery"
                  value={
                    vehicle.batteryKwh === null ? null : `${vehicle.batteryKwh} kWh`
                  }
                />
                <Fact
                  label="Range"
                  value={
                    vehicle.rangeKm === null ? null : formatKm(vehicle.rangeKm)
                  }
                />
              </>
            ) : (
              <>
                <Fact
                  label="Engine"
                  value={
                    vehicle.engineCc === null ? null : `${vehicle.engineCc} cc`
                  }
                />
                <Fact
                  label="Mileage"
                  value={
                    vehicle.mileageKmpl === null
                      ? null
                      : `${vehicle.mileageKmpl} kmpl`
                  }
                />
              </>
            )}
            <Fact
              label="Power"
              value={vehicle.powerBhp === null ? null : `${vehicle.powerBhp} bhp`}
            />
            <Fact label="Colour" value={vehicle.color} />
            <Fact label="City" value={vehicle.city} />
            <Fact label="Registration" value={vehicle.registrationState} />
          </dl>

          {vehicle.description ? (
            <section className="mt-5" aria-label="Description">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
                Description
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.66] tracking-[-0.006em] text-body">
                {vehicle.description}
              </p>
            </section>
          ) : null}

          <section className="mt-5" aria-label="Features">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Features · {vehicle.features.length}
            </h3>
            {vehicle.features.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {vehicle.features.map((feature) => (
                  <li
                    key={feature}
                    className={`rounded-full px-2 py-[3px] text-[11.5px] leading-[1.3] ${
                      matched.has(feature)
                        ? "border border-lavender-line bg-lavender-bg font-medium text-lavender"
                        : "border border-line bg-surface-2 text-body"
                    }`}
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-[12.5px] text-muted">No features listed.</p>
            )}
          </section>

          <p className="mt-6 font-mono text-[10px] text-muted">
            {vehicle.id}
            {listedText ? ` · listed ${listedText}` : ""}
            {isFetching && isPlaceholderData ? " · refreshing…" : ""}
          </p>
          {isError ? (
            <p className="mt-1 text-[11.5px] text-red">
              Could not refresh this listing. Showing the copy from the search
              results.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
