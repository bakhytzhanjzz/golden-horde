"use client";

import { useState } from "react";
import type { Route, Site, SiteType } from "@/lib/types";
import { ROUTE_STYLES } from "@/lib/routes";
import { siteTypeMeta } from "@/lib/siteMeta";
import { useLang, useStrings } from "@/lib/i18n";
import {
  locName,
  locRouteFunFact,
  locRouteStory,
  locSiteFunFact,
  locSiteQuiz,
  locSiteSides,
  locSiteStory,
} from "@/lib/localize";
import Quiz from "./Quiz";

type Selection = Site | Route;

type InfoPanelProps = {
  selection: Selection | null;
  onClose: () => void;
  quizAnsweredIndex?: number;
  onQuizAnswer: (siteId: string, index: number) => void;
};

const TYPE_EMBLEM: Record<SiteType, string> = {
  city: "🏛️",
  capital: "👑",
  sacred: "🕌",
  port: "⚓",
  battle: "⚔️",
};

function isRoute(sel: Selection): sel is Route {
  return "route_type" in sel;
}

function SiteBanner({ site }: { site: Site }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = useStrings();
  const meta = siteTypeMeta(site.type);

  return (
    <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#e7dcc0]">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1"
        style={{
          background: `linear-gradient(135deg, ${meta.color}22 0%, ${meta.color}55 100%)`,
        }}
      >
        <span className="text-5xl opacity-45">{TYPE_EMBLEM[site.type]}</span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: meta.color }}
        >
          {t.siteType[site.type]}
        </span>
      </div>

      {site.image && !failed && (
        <img
          src={site.image}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#efe6cf] to-transparent" />
    </div>
  );
}

function BattleSides({ site }: { site: Site }) {
  const t = useStrings();
  const { lang } = useLang();
  const sides = locSiteSides(site, lang);
  if (!sides) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
        {t.whoFought}
      </h3>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="rounded-lg border border-[#d8cba8] bg-[#f4ecd8] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8391f]">
            {t.attacker}
          </div>
          <div className="mt-1 text-sm font-medium text-[#3a2f1b]">
            {sides.attacker}
          </div>
        </div>
        <div className="text-xl" aria-hidden>
          ⚔️
        </div>
        <div className="rounded-lg border border-[#d8cba8] bg-[#f4ecd8] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#2c7a7b]">
            {t.defender}
          </div>
          <div className="mt-1 text-sm font-medium text-[#3a2f1b]">
            {sides.defender}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function InfoPanel({
  selection,
  onClose,
  quizAnsweredIndex,
  onQuizAnswer,
}: InfoPanelProps) {
  const t = useStrings();
  const { lang } = useLang();
  const open = selection !== null;
  const site = selection && !isRoute(selection) ? selection : null;
  const route = selection && isRoute(selection) ? selection : null;

  const displayName = selection ? locName(selection.name, lang) : "";
  const altNames = selection
    ? [selection.name.en, selection.name.kz, selection.name.ru].filter(
        (n): n is string => !!n && n !== displayName
      )
    : [];

  const storyText = site
    ? locSiteStory(site, lang)
    : route
    ? locRouteStory(route, lang)
    : "";
  const funFactText = site
    ? locSiteFunFact(site, lang)
    : route
    ? locRouteFunFact(route, lang)
    : undefined;
  const quiz = site ? locSiteQuiz(site, lang) : undefined;

  return (
    <>
      {/* Backdrop */}
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
          <>
            {site && <SiteBanner site={site} />}

            <header className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-[#d8cba8] bg-[#efe6cf] px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-[#3a2f1b]">
                  {displayName}
                </h2>
                {altNames.length > 0 && (
                  <p className="mt-1 text-sm text-[#7a6a48]">
                    {altNames.join(" · ")}
                  </p>
                )}
                {site && (
                  <span
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: siteTypeMeta(site.type).color }}
                  >
                    {t.siteType[site.type]}
                  </span>
                )}
                {route && (
                  <span
                    className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{
                      backgroundColor: ROUTE_STYLES[route.route_type].color,
                    }}
                  >
                    {t.routeType[route.route_type]} {t.routeSuffix}
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
              {/* Key dates / active period */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
                  {route ? t.activePeriod : t.keyDates}
                </h3>
                {route ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-[#9a8860]">{t.activeFrom}</dt>
                      <dd className="font-semibold text-[#3a2f1b]">
                        {route.active_from}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#9a8860]">{t.activeUntil}</dt>
                      <dd className="font-semibold text-[#3a2f1b]">
                        {route.active_to}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  site && (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <dt className="text-[#9a8860]">
                          {site.type === "battle" ? t.fought : t.founded}
                        </dt>
                        <dd className="font-semibold text-[#3a2f1b]">
                          {site.founded}
                        </dd>
                      </div>
                      {site.type !== "battle" && (
                        <div>
                          <dt className="text-[#9a8860]">{t.destroyed}</dt>
                          <dd className="font-semibold text-[#3a2f1b]">
                            {site.destroyed ?? "—"}
                          </dd>
                        </div>
                      )}
                      {site.peak_period && (
                        <div className="col-span-2">
                          <dt className="text-[#9a8860]">{t.peakPeriod}</dt>
                          <dd className="font-semibold text-[#3a2f1b]">
                            {site.peak_period[0]} – {site.peak_period[1]}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )
                )}
              </section>

              {/* Battle sides */}
              {site && site.type === "battle" && <BattleSides site={site} />}

              {/* Story */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
                  {t.story}
                </h3>
                <p className="text-[15px] leading-relaxed text-[#4a3f28]">
                  {storyText}
                </p>
              </section>

              {/* Fun fact */}
              {funFactText && (
                <section className="rounded-lg border border-[#d8cba8] bg-[#efe6cf] p-4">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#9a8860]">
                    {t.didYouKnow}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-[#4a3f28]">
                    {funFactText}
                  </p>
                </section>
              )}

              {/* Micro-quiz */}
              {site && quiz && (
                <Quiz
                  quiz={quiz}
                  answeredIndex={quizAnsweredIndex}
                  onAnswer={(i) => onQuizAnswer(site.id, i)}
                />
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
