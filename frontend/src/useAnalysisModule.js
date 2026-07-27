import { useCallback, useEffect, useState } from "react";
import { apiDeleteAnalysis, apiGetAnalyses, apiUploadDocument } from "./pitchmateApi";
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

/**
 * Turn an arbitrary dashboard result object into readable text suitable for
 * storing as a Knowledge Base document. Generic on purpose — every module
 * (market, gtm, competition, traction, finance, valuation, investors, deck,
 * debrief) has a different result shape, so this walks whatever it's given
 * instead of needing a per-module formatter.
 */
export function formatResultAsText(title, result, depth = 0) {
    const indent = "  ".repeat(depth);
    const lines = depth === 0 ? [`# ${title}`, ""] : [];

    const titleCase = (key) =>
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    for (const [key, value] of Object.entries(result || {})) {
        if (value === null || value === undefined || value === "") continue;
        if (Array.isArray(value)) {
            if (value.length === 0) continue;
            lines.push(`${indent}${titleCase(key)}:`);
            for (const item of value) {
                if (item && typeof item === "object") {
                    const parts = Object.entries(item)
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .map(([k, v]) => `${titleCase(k)}: ${v}`);
                    lines.push(`${indent}  - ${parts.join(" | ")}`);
                } else {
                    lines.push(`${indent}  - ${item}`);
                }
            }
        } else if (typeof value === "object") {
            lines.push(`${indent}${titleCase(key)}:`);
            lines.push(formatResultAsText(title, value, depth + 1));
        } else {
            lines.push(`${indent}${titleCase(key)}: ${value}`);
        }
    }
    return lines.join("\n");
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

    /**
     * Delete the persisted saved analysis for this module ("Clear" action).
     * Only clears server-side + this hook's `saved` state — the calling page
     * still owns its own `result`/`lastRun` local state and must reset that
     * itself after this resolves.
     */
    const clearAnalysis = useCallback(async () => {
        await apiDeleteAnalysis(module);
        setSaved(null);
        setWasEmpty(true);
        refreshProfile?.();
    }, [module, refreshProfile]);

    /** Push a result into the Knowledge Base as a searchable document ("Store" action). */
    const storeToKnowledgeBase = useCallback(async (result, sourceName) => {
        const label = MODULE_LABEL[module] || module;
        const text = formatResultAsText(label, result);
        const name = sourceName || `${label} — ${new Date().toLocaleDateString()}`;
        const res = await apiUploadDocument(text, name);
        notify?.(`Stored "${res.source_name}" in Knowledge Base`);
        return res;
    }, [module, notify]);

    return { ctx, profile, saved, allResults, loadingSaved, reportRun, clearAnalysis, storeToKnowledgeBase };
}
