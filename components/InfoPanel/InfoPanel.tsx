"use client";

import type { Route, Site } from "@/lib/types";
import { ROUTE_STYLES } from "@/lib/routes";

type Selection = Site | Route;

type InfoPanelProps = {
  selection: Selection | null;
  onClose: () => void;
};

function isRoute(sel: Selection): sel is Route {
  return "route_type" in sel;
}

export default function InfoPanel({ selection, onClose }: InfoPanelProps) {
  const open = selection !== null;

  return (
    <>
      {/* Backdrop (mobile-friendly; click to close) */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-[1000] bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-[1001] flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#f4ecd8] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selection && (
          <div className="flex h-full flex-col">
            <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-[#d8cba8] bg-[#efe6cf] px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-[#3a2f1b]">
                  {selection.name.en}
                </h2>
                {(selection.name.kz || selection.name.ru) && (
                  <p className="mt-1 text-sm text-[#7a6a48]">
                    {[selection.name.kz, selection.name.ru]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {isRoute(selection) && (
                  <span
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{
                      backgroundColor: ROUTE_STYLES[selection.route_type].color,
                    }}
                  >
                    {ROUTE_STYLES[selection.route_type].label} route
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-full p-1 text-2xl leading-none text-[#7a6a48] transition-colors hover:bg-[#e0d5b6] hover:text-[#3a2f1b]"
              >
                ×
              </button>
            </header>

            <div className="flex-1 space-y-6 px-6 py-5">
              {/* Key dates */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
                  {isRoute(selection) ? "Active period" : "Key dates"}
                </h3>
                {isRoute(selection) ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-[#9a8860]">Active from</dt>
                      <dd className="font-semibold text-[#3a2f1b]">
                        {selection.active_from}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#9a8860]">Active until</dt>
                      <dd className="font-semibold text-[#3a2f1b]">
                        {selection.active_to}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-[#9a8860]">Founded</dt>
                      <dd className="font-semibold text-[#3a2f1b]">
                        {selection.founded}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#9a8860]">Destroyed / abandoned</dt>
                      <dd className="font-semibold text-[#3a2f1b]">
                        {selection.destroyed ?? "—"}
                      </dd>
                    </div>
                    {selection.peak_period && (
                      <div className="col-span-2">
                        <dt className="text-[#9a8860]">Peak period</dt>
                        <dd className="font-semibold text-[#3a2f1b]">
                          {selection.peak_period[0]} – {selection.peak_period[1]}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </section>

              {/* Story */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
                  Story
                </h3>
                <p className="text-[15px] leading-relaxed text-[#4a3f28]">
                  {selection.story}
                </p>
              </section>

              {/* Fun fact */}
              {selection.fun_fact && (
                <section className="rounded-lg border border-[#d8cba8] bg-[#efe6cf] p-4">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
                    Did you know?
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[#4a3f28]">
                    {selection.fun_fact}
                  </p>
                </section>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
