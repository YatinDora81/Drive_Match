"use client";

import { CarIcon } from "../icons";
import { Ideas } from "../search/Ideas";
import { EmptyState } from "../ui/EmptyState";

type Props = {
  message: string | null;
  onPick: (query: string) => void;
};

export function UnsupportedPane({ message, onPick }: Props) {
  return (
    <EmptyState
      tone="brand"
      icon={<CarIcon />}
      title="That doesn’t read like a car search"
      actions={<Ideas onPick={onPick} limit={3} center />}
    >
      <p>
        {message ?? "This search only understands questions about the used-car catalogue."}{" "}
        Describe the kind of car, the budget, or where you’re looking. Try one of these:
      </p>
    </EmptyState>
  );
}
