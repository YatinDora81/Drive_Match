"use client";

import { groupIndian, inrParts, labelEnum, plural } from "../../lib/format";
import { FUEL_TONE, toneStyle } from "../../lib/tones";
import type { SearchFilters, SearchResult, Vehicle } from "../../lib/types";
import { violationsFor } from "../../lib/violations";
import { SparkIcon, WarningIcon } from "../icons";
import { CarArt } from "./CarArt";
import { SafetyBadge } from "./SafetyBadge";

type Props = {
  result: SearchResult;
  requested: SearchFilters;
  debug: boolean;
  index: number;
  crown: string | null;
  onOpen: (result: SearchResult) => void;
};

const UNIT_WORD = { L: "Lakh", Cr: "Crore", "": "" } as const;

const PICTURE_PILL =
  "absolute rounded-full bg-card px-2.5 py-1 text-[11.5px] leading-none font-bold";

type Stat = { label: string; value: string };

function thirdStat(vehicle: Vehicle): Stat {
  if (vehicle.fuelType === "ELECTRIC" && vehicle.rangeKm !== null) {
    return { value: groupIndian(vehicle.rangeKm), label: "km range" };
  }
  if (vehicle.mileageKmpl !== null) {
    const kmpl = Number.isInteger(vehicle.mileageKmpl)
      ? String(vehicle.mileageKmpl)
      : vehicle.mileageKmpl.toFixed(1);
    return { value: kmpl, label: "kmpl" };
  }
  return { value: String(vehicle.seats), label: plural(vehicle.seats, "seat") };
}

export function VehicleCard({ result, requested, debug, index, crown, onOpen }: Props) {
  const { vehicle, matchedFeatures, score } = result;
  const titleId = `vehicle-${vehicle.id}-title`;
  const price = inrParts(vehicle.price);
  const violations = violationsFor(vehicle, requested);

  const stats: Stat[] = [
    { value: groupIndian(vehicle.kmDriven), label: "km driven" },
    { value: String(vehicle.ownerCount), label: plural(vehicle.ownerCount, "owner") },
    thirdStat(vehicle),
  ];

  const matched = new Set(matchedFeatures);
  const features = [
    ...matchedFeatures.filter((feature) => vehicle.features.includes(feature)),
    ...vehicle.features.filter((feature) => !matched.has(feature)),
  ].slice(0, 2);

  return (
    <article
      aria-labelledby={titleId}
      style={toneStyle(FUEL_TONE[vehicle.fuelType])}
      className="relative flex h-full flex-col overflow-hidden rounded-panel border border-line bg-card shadow-card transition-[translate,box-shadow] duration-200 ease-soft hover:-translate-y-0.5 hover:shadow-up has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand"
    >
      <div className="relative grid h-32 place-items-center bg-[var(--tone-soft)] text-[var(--tone)]">
        <CarArt bodyType={vehicle.bodyType} className="w-[62%] max-w-[190px]" />
        <span className={`${PICTURE_PILL} top-2.5 left-2.5 text-[var(--tone)]`}>
          {labelEnum(vehicle.fuelType)}
        </span>
        <span className={`${PICTURE_PILL} top-2.5 right-2.5 text-ink-2`}>
          {labelEnum(vehicle.bodyType)}
        </span>
        {crown ? (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11.5px] leading-none font-bold text-on-brand">
            <SparkIcon className="size-3" />
            {crown}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-baseline gap-1.5 text-ink">
          <span className="text-[26px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            ₹{price.value}
          </span>
          {price.unit ? (
            <span className="text-[13.5px] font-bold text-ink-3">{UNIT_WORD[price.unit]}</span>
          ) : null}
        </p>
        <p className="mt-1 text-[11.5px] text-ink-3 tabular-nums">
          ₹{groupIndian(vehicle.price)}
        </p>

        <h3
          id={titleId}
          className="mt-3 text-[16px] leading-snug font-bold tracking-[-0.01em] text-ink"
        >
          <button
            type="button"
            data-card-index={index}
            onClick={() => onOpen(result)}
            className="cursor-pointer text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
            <span className="sr-only">, view details</span>
          </button>
        </h3>
        <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
          {vehicle.variant} · {labelEnum(vehicle.transmission)} · {vehicle.city}
        </p>

        <dl className="mt-4 grid grid-cols-3 border-y border-line py-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex min-w-0 flex-col-reverse ${
                i > 0 ? "border-l border-line pl-3" : ""
              }`}
            >
              <dt className="mt-0.5 truncate text-[11.5px] text-ink-3">{stat.label}</dt>
              <dd className="truncate text-[15px] leading-tight font-extrabold text-ink tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        {violations.length > 0 ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-field bg-sun-soft px-3 py-2 text-[12.5px] leading-snug font-semibold text-sun">
            <WarningIcon className="mt-px size-3.5 shrink-0" />
            <span className="min-w-0 tabular-nums">
              {violations.map((v) => v.caption).join(" · ")}
            </span>
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <SafetyBadge rating={vehicle.safetyRating} />
          {features.length > 0 ? (
            <ul aria-label="Features" className="flex min-w-0 flex-wrap justify-end gap-1.5">
              {features.map((feature) => {
                const hit = matched.has(feature);
                return (
                  <li
                    key={feature}
                    title={feature}
                    className={`max-w-[9.5rem] truncate rounded-full px-2.5 py-1 text-[11.5px] leading-none font-semibold ${
                      hit ? "bg-electric-soft text-electric" : "bg-sunk text-ink-3"
                    }`}
                  >
                    {feature}
                    {hit ? <span className="sr-only"> (matches your search)</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {debug ? (
          <p className="mt-2 font-mono text-[10.5px] text-ink-3">
            #{result.rank} · score {score === null ? "—" : score.toFixed(3)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
