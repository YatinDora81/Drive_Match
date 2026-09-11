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
    <div aria-hidden="true" className="flex flex-1 flex-col">
      <div className="h-16 border-b border-line" />
      <div className="mx-auto w-full max-w-[1180px] px-4 pt-16 md:px-8">
        <div className="h-7 w-56 rounded-full bg-sunk" />
        <div className="mt-6 h-12 w-full max-w-[560px] rounded-tile bg-sunk" />
        <div className="mt-8 h-[68px] w-full max-w-[760px] rounded-panel bg-sunk" />
      </div>
    </div>
  );
}
