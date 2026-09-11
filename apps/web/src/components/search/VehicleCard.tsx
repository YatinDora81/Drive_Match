"use client";

import { formatInr, formatKm, labelEnum, ordinal } from "../../lib/format";
import type { SearchFilters, SearchResult } from "../../lib/types";
import {
  violationMap,
  violationsFor,
  type ViolationField,
} from "../../lib/violations";
import { BodyGlyph } from "./BodyGlyph";
import { NcapStars } from "./NcapStars";

type Props = {
  result: SearchResult;
  requested: SearchFilters;
  debug: boolean;
  index: number;
  onOpen: (result: SearchResult) => void;
};

function Dot() {
  return (
    <span aria-hidden="true" className="mx-[5px] text-rule-2">
      ·
    </span>
  );
}

export function VehicleCard({ result, requested, debug, index, onOpen }: Props) {
  const { vehicle, matchedFeatures, score } = result;
  const titleId = `vehicle-${vehicle.id}-title`;
  const bad = violationMap(violationsFor(vehicle, requested));
  const warn = (field: ViolationField) =>
    bad[field] ? "font-medium text-warn" : "";

  const seatsFiltered =
    requested.seatsMin !== undefined || requested.seatsMax !== undefined;
  const showSeats = seatsFiltered || vehicle.seats >= 6;
  const isEv = vehicle.fuelType === "ELECTRIC";

  const matched = new Set(matchedFeatures);
  const tags = [
    ...matchedFeatures,
    ...vehicle.features.filter((feature) => !matched.has(feature)),
  ].slice(0, 3);

  const otherCaptions = (Object.keys(bad) as ViolationField[])
    .filter((field) => field !== "price")
    .map((field) => bad[field])
    .filter((caption): caption is string => Boolean(caption));

  return (
    <article
      aria-labelledby={titleId}
      className="group relative flex h-full flex-col overflow-hidden rounded-[12px] border border-rule bg-paper transition-[border-color,background-color] duration-[180ms] hover:border-rule-2 hover:bg-paper-2 has-[:focus-visible]:border-accent has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-accent-bg"
    >
      <BodyGlyph bodyType={vehicle.bodyType} color={vehicle.color} />

      <div className="flex flex-1 flex-col gap-1 p-[14px]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div
              className={`font-display text-[22px] font-semibold leading-none tracking-[-0.03em] ${
                bad.price ? "text-warn" : "text-ink"
              }`}
            >
              {formatInr(vehicle.price)}
            </div>
            {bad.price ? (
              <p className="mt-1 text-[11px] font-medium text-warn">{bad.price}</p>
            ) : null}
          </div>
          <NcapStars rating={vehicle.safetyRating} short={Boolean(bad.safety)} />
        </div>

        <h3
          id={titleId}
          className="mt-1.5 text-[15px] font-medium leading-[1.3] tracking-[-0.012em] text-ink"
        >
          <button
            type="button"
            data-card-index={index}
            onClick={() => onOpen(result)}
            className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            <span className={warn("year")}>{vehicle.year}</span> {vehicle.make}{" "}
            {vehicle.model}
            <span className="sr-only">, view details</span>
          </button>
        </h3>
        <p className="text-[12.5px] leading-[1.45] text-ink-2">{vehicle.variant}</p>

        <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-2">
          <span className={warn("km")}>{formatKm(vehicle.kmDriven)}</span>
          <Dot />
          <span className={warn("owners")}>
            {ordinal(vehicle.ownerCount)} owner
          </span>
          <Dot />
          <span className={warn("city")}>{vehicle.city}</span>
        </p>

        <p className="text-[12.5px] leading-[1.5] text-ink-2">
          {vehicle.fuelType === "CNG" ? (
            <span className="rounded-[4px] bg-ok-bg px-1.5 py-px text-[11px] font-medium text-ok">
              CNG
            </span>
          ) : (
            <span>{labelEnum(vehicle.fuelType)}</span>
          )}
          {isEv && vehicle.rangeKm !== null ? (
            <>
              <Dot />
              <span>{formatKm(vehicle.rangeKm)} range</span>
            </>
          ) : null}
          {!isEv ? (
            <>
              <Dot />
              <span>{labelEnum(vehicle.transmission)}</span>
            </>
          ) : null}
          <Dot />
          <span className={warn("bodyType")}>{labelEnum(vehicle.bodyType)}</span>
          {showSeats ? (
            <>
              <Dot />
              <span className={warn("seats")}>{vehicle.seats} seats</span>
            </>
          ) : null}
        </p>

        {otherCaptions.length > 0 ? (
          <p className="text-[11px] font-medium leading-[1.5] text-warn">
            {otherCaptions.join(" · ")}
          </p>
        ) : null}

        {tags.length > 0 ? (
          <ul aria-label="Features" className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((feature) => {
              const hit = matched.has(feature);
              return (
                <li
                  key={feature}
                  className={`rounded-full px-2 py-[3px] text-[11px] leading-[1.3] ${
                    hit
                      ? "bg-accent-bg font-medium text-accent"
                      : "border border-rule bg-paper-2 text-ink-2"
                  }`}
                >
                  {feature}
                </li>
              );
            })}
          </ul>
        ) : null}

        {debug ? (
          <p className="mt-auto pt-2 font-mono text-[10px] text-ink-3">
            #{result.rank} · score {score === null ? "—" : score.toFixed(3)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
