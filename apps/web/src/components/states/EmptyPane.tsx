"use client";

import { hardConstraintsIn } from "../../lib/chips";
import type { SearchFilters } from "../../lib/types";
import { CarIcon, UndoIcon } from "../icons";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

type Props = {
  requested: SearchFilters;
  mode: "auto" | "edit" | "exact";
  onUndo: () => void;
  onReset: () => void;
  onAllowClose: () => void;
};

const LEAD: Record<Props["mode"], string> = {
  edit: "Relaxation is off while you edit tags, so nothing was widened. Remove a tag or undo to let the search loosen constraints for you.",
  exact: "Exact matches only is on, so nothing was widened.",
  auto: "The search already tried loosening the soft constraints (budget, mileage, year, city, seats, safety).",
};

export function EmptyPane({ requested, mode, onUndo, onReset, onAllowClose }: Props) {
  const hard = hardConstraintsIn(requested);

  return (
    <EmptyState
      tone="brand"
      icon={<CarIcon />}
      title="No cars match all of that"
      actions={
        <>
          {mode === "edit" ? (
            <Button variant="outline" onClick={onUndo}>
              <UndoIcon />
              Undo edits
            </Button>
          ) : null}
          {mode === "exact" ? (
            <Button variant="primary" onClick={onAllowClose}>
              Allow close matches
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onReset}>
            Start over
          </Button>
        </>
      }
    >
      <p>
        {LEAD[mode]} Fuel, gearbox, make and model are never relaxed
        {hard.length > 0 ? (
          <>
            {" "}— this search pins{" "}
            <b className="font-semibold text-ink">{hard.join(", ")}</b>. Remove one of
            those tags to widen the net.
          </>
        ) : (
          "."
        )}
      </p>
    </EmptyState>
  );
}
