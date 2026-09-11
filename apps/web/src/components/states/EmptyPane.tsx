"use client";

import { hardConstraintsIn } from "../../lib/chips";
import type { SearchFilters } from "../../lib/types";
import { Button } from "../ui/Button";

type Props = {
  requested: SearchFilters;
  overrideMode: boolean;
  onUndo: () => void;
  onReset: () => void;
};

const NEVER_RELAXED = "Fuel, gearbox, make and model";

export function EmptyPane({ requested, overrideMode, onUndo, onReset }: Props) {
  const hard = hardConstraintsIn(requested);

  return (
    <div className="animate-rise grid place-items-center px-5 py-14">
      <div className="max-w-[440px] text-center">
        <div
          aria-hidden="true"
          className="mb-[18px] font-display text-[52px] font-bold leading-none text-rule-2"
        >
          ∅
        </div>
        <h3 className="font-display text-[21px] font-semibold tracking-[-0.028em] text-ink">
          No cars match all of that
        </h3>
        <p className="mt-2.5 text-[13.5px] leading-[1.66] text-ink-2">
          {overrideMode
            ? "Relaxation is off while you are editing filters, so nothing was widened. Remove a chip above, or undo to let the search loosen constraints for you."
            : "The search already tried loosening the soft constraints (budget, mileage, year, city, seats, safety)."}{" "}
          {NEVER_RELAXED} are never relaxed
          {hard.length > 0 ? (
            <>
              {" "}
              — this query pins{" "}
              <span className="font-medium text-ink">{hard.join(", ")}</span>.
              Remove one of those chips to widen the net.
            </>
          ) : (
            "."
          )}
        </p>
        <div className="mt-[19px] flex justify-center gap-2">
          {overrideMode ? (
            <Button variant="outline" onClick={onUndo}>
              Undo edits
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onReset}>
            Start over
          </Button>
        </div>
      </div>
    </div>
  );
}
