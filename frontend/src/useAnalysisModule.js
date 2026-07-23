import { useCallback, useEffect, useState } from "react";
import { apiGetAnalyses } from "./pitchmateApi";
import { useDashboardContext } from "./dashboardContext";

/**
 * Shared per-module state for the dashboard feature pages (market, competition,
 * gtm, investors, valuation, deck). Handles:
 *   - loading the user's saved analysis for this module (to restore prior work)
 *   - reporting a fresh run (toast + readiness refresh via the layout context)
 *
 * Each page still owns its form/result state; this centralizes the persistence
 * plumbing so all six behave identically. See dashboard/store.py server-side.
 */

const MODULE_LABEL = {
    market: "Market validated",
    competition: "Competition mapped",
    gtm: "GTM plan ready",
    investors: "Investors targeted",
    valuation: "Valuation estimated",
    deck: "Deck drafted",
    debrief: "Meeting debriefed",
    finance: "Financials framed",
    traction: "Traction framed",
};

// Readiness weight each module contributes — used for the "+X% ready" toast the
// first time a module is completed. Mirrors weights in startup/router.py.
const MODULE_GAIN = { market: 10, investors: 10, deck: 10 };

/** Human "2h ago" style relative time from an ISO string. */
export function relativeTime(iso) {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const secs = Math.max(1, Math.round((Date.now() - then) / 1000));
    if (secs < 60) return "just now";
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export function useAnalysisModule(module) {
    const ctx = useDashboardContext();
    const { profile, refreshProfile, notify } = ctx;
    const [saved, setSaved] = useState(null); // { inputs, result, updated_at } | null
    const [allResults, setAllResults] = useState({}); // every module's saved analysis (for cross-page pull)
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [wasEmpty, setWasEmpty] = useState(true); // no saved result at load → first run earns the "+X%" toast

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await apiGetAnalyses();
                const results = data?.results || {};
                const s = results[module] || null;
                if (!cancelled) {
                    setSaved(s);
                    setAllResults(results);
                    setWasEmpty(!s);
                }
            } catch {
                if (!cancelled) { setSaved(null); setAllResults({}); }
            } finally {
                if (!cancelled) setLoadingSaved(false);
            }
        })();
        return () => { cancelled = true; };
    }, [module]);

    /** Call after a successful run: toasts, updates last-run, refreshes readiness. */
    const reportRun = useCallback((result, inputs) => {
        const label = MODULE_LABEL[module] || "Saved";
        const gain = wasEmpty && MODULE_GAIN[module] ? `+${MODULE_GAIN[module]}% ready` : null;
        notify?.(label, { gain });
        setSaved({ inputs, result, updated_at: new Date().toISOString() });
        setWasEmpty(false);
        refreshProfile?.();
    }, [module, wasEmpty, notify, refreshProfile]);

    return { ctx, profile, saved, allResults, loadingSaved, reportRun };
}
