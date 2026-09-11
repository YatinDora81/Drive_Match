import { Suspense } from "react";
import { SearchWorkspace } from "../src/components/search/SearchWorkspace";

export default function Page() {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <SearchWorkspace />
    </Suspense>
  );
}

function WorkspaceFallback() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-[1040px] px-5 pt-[124px]">
      <div className="mx-auto h-[32px] w-[280px] rounded-lg bg-surface-2" />
      <div className="mx-auto mt-3 h-[18px] w-[220px] rounded bg-surface-2" />
      <div className="mt-8 h-[196px] rounded-card border border-input-card-line bg-input-card" />
    </div>
  );
}
