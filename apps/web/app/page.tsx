import { Suspense } from "react";
import { Header } from "../src/components/layout/Header";
import { SearchWorkspace } from "../src/components/search/SearchWorkspace";

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<WorkspaceFallback />}>
        <SearchWorkspace />
      </Suspense>
    </>
  );
}

function WorkspaceFallback() {
  return (
    <div
      aria-hidden="true"
      className="sticky top-0 z-[300] border-b border-rule bg-paper/95 backdrop-blur"
    >
      <div className="mx-auto max-w-[1240px] px-5 py-3.5 md:px-8">
        <div className="mb-1.5 h-[14px] w-[160px] rounded bg-paper-3" />
        <div className="h-[50px] rounded-xl border border-rule-2 bg-paper-2" />
      </div>
    </div>
  );
}
