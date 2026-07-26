import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGetReadiness, apiGetPipelineSummary, apiGetAnalyses } from "../pitchmateApi";
import { CheckCircleIcon, FunnelIcon, TrendingUpIcon, AlertCircleIcon, ChevronDownIcon } from "../icons";
import { useDashboardContext } from "../dashboardContext";
import { relativeTime } from "../useAnalysisModule";
import { motion, AnimatePresence, useReducedMotion, useCountUp, SPRING_SOFT } from "../motion";

const STALE_DAYS = 14;
const MODULE_COVERAGE = [
    { key: "market", label: "Market sizing", path: "/market" },
    { key: "competition", label: "Competition", path: "/competition" },
    { key: "traction", label: "Traction", path: "/traction" },
    { key: "gtm", label: "GTM plan", path: "/gtm" },
    { key: "finance", label: "Financials", path: "/finance" },
    { key: "valuation", label: "Valuation", path: "/valuation" },
    { key: "investors", label: "Investor targeting", path: "/investors" },
    { key: "deck", label: "Pitch deck", path: "/deck" },
    { key: "debrief", label: "Meeting debrief", path: "/debrief" },
];

const QUICK_ACTIONS = [
    { label: "Practice a call", path: "/practice", desc: "Roleplay investor Q&A" },
    { label: "Track pipeline", path: "/pipeline", desc: "Investor CRM" },
    { label: "Plan roadmap", path: "/roadmap", desc: "Quarterly board" },
    { label: "Upload docs", path: "/settings", desc: "Deck & knowledge base" },
];

const ACTIVITY_LIMIT = 8;

// Module -> activity feed label + destination tab, mirrors MODULE_LABEL in
// useAnalysisModule.js but phrased as a past-tense action for the feed.
const MODULE_ACTIVITY = {
    market: { label: "Ran Market sizing", path: "/market" },
    competition: { label: "Mapped Competition", path: "/competition" },
    gtm: { label: "Built GTM strategy", path: "/gtm" },
    investors: { label: "Targeted Investors", path: "/investors" },
    valuation: { label: "Estimated Valuation", path: "/valuation" },
    deck: { label: "Drafted Deck", path: "/deck" },
    debrief: { label: "Debriefed a meeting", path: "/debrief" },
    finance: { label: "Framed Financials", path: "/finance" },
    traction: { label: "Framed Traction", path: "/traction" },
};

const VERDICT_LABEL = { credible: "Credible", needs_work: "Needs work", not_credible: "Not credible" };

function ratioTone(ratio) {
    if (ratio == null) return "";
    if (ratio >= 3) return "warm";
    if (ratio >= 1) return "lukewarm";
    return "dead";
}
function runwayTone(months) {
    if (months == null) return "";
    if (months >= 12) return "warm";
    if (months >= 6) return "lukewarm";
    return "dead";
}

/**
 * Dashboard home — pitch readiness, pipeline pulse, key numbers pulled from
 * saved analyses, and a merged recent-activity feed. This is deliberately a
 * *summary* surface: every number here links back to the page that owns it.
 */
export default function HomePage() {
    const { profile } = useDashboardContext();
    const [readiness, setReadiness] = useState(null);
    const [pipeline, setPipeline] = useState(null);
    const [analyses, setAnalyses] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showChecklist, setShowChecklist] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const [r, p, a] = await Promise.allSettled([
                apiGetReadiness(),
                apiGetPipelineSummary(),
                apiGetAnalyses(),
            ]);
            if (cancelled) return;
            setReadiness(r.status === "fulfilled" ? r.value : null);
            setPipeline(p.status === "fulfilled" && Array.isArray(p.value?.investors) ? p.value : null);
            setAnalyses(a.status === "fulfilled" ? a.value : null);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [profile?.updated_at, profile?.company_name, profile?.product_description]);

    const name = profile?.company_name || "Founder";
    const stage = (profile?.lifecycle_stage || "idea").replace(/_/g, " ");
    const percent = readiness?.overall_percent ?? 0;
    const clampedPercent = Math.min(100, percent);
    const reduceMotion = useReducedMotion();
    const displayPercent = useCountUp(percent, { reduce: reduceMotion });

    const milestones = readiness?.milestones || [];
    const remainingMilestones = milestones.filter((m) => !m.done);

    const investors = pipeline?.investors || [];

    const staleInvestors = useMemo(() => {
        const now = Date.now();
        return investors.filter((inv) => !inv.pipeline_stage?.startsWith("closed_") && inv.updated_at
            && (now - new Date(inv.updated_at).getTime()) > STALE_DAYS * 24 * 3600 * 1000);
    }, [investors]);

    const results = analyses?.results || {};
    const valuation = results.valuation?.result;
    const market = results.market?.result;
    const finance = results.finance?.result;
    const gtm = results.gtm?.result;
    const traction = results.traction?.result;

    const recentActivity = useMemo(() => {
        const items = [];
        for (const [module, entry] of Object.entries(results)) {
            if (!entry?.updated_at) continue;
            const meta = MODULE_ACTIVITY[module];
            items.push({
                key: `analysis-${module}`,
                label: meta?.label || `Updated ${module}`,
                path: meta?.path || "/",
                at: entry.updated_at,
            });
        }
        for (const inv of investors) {
            if (!inv.updated_at) continue;
            const isNew = inv.created_at && inv.updated_at
                && Math.abs(new Date(inv.updated_at) - new Date(inv.created_at)) < 5000;
            items.push({
                key: `investor-${inv.id}`,
                label: `${isNew ? "Added" : "Updated"} investor ${inv.name}`,
                path: "/pipeline",
                at: inv.updated_at,
            });
        }
        items.sort((a, b) => new Date(b.at) - new Date(a.at));
        return items.slice(0, ACTIVITY_LIMIT);
    }, [results, investors]);

    const coverageDone = useMemo(
        () => MODULE_COVERAGE.filter((m) => results[m.key]?.result).length,
        [results],
    );

    return (
        <div>
            <div className="dash-page-header">
                <h2>Mission control</h2>
                <p>
                    {profile?.profile_complete
                        ? `${name} · stage: ${stage}`
                        : "Set up your startup profile to unlock tailored coaching."}
                </p>
            </div>

            <div className="dash-grid">
                <div>
                    <div className="dash-card home-progress-card compact">
                        {loading ? (
                            <div className="dash-loading"><span className="dash-spinner" /> Loading progress...</div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="home-progress-strip"
                                    onClick={() => setShowChecklist((v) => !v)}
                                    aria-expanded={showChecklist}
                                >
                                    <div className="home-progress-ring" style={{ "--pct": clampedPercent }}>
                                        <span>{displayPercent}%</span>
                                    </div>
                                    <div className="home-progress-strip-text">
                                        <div className="home-progress-strip-title">Pitch readiness</div>
                                        <div className="home-progress-strip-sub">
                                            {remainingMilestones.length === 0
                                                ? "All milestones done"
                                                : `${remainingMilestones.length} item${remainingMilestones.length > 1 ? "s" : ""} left · ${remainingMilestones[0].label}`}
                                        </div>
                                    </div>
                                    <span className={`home-progress-toggle ${showChecklist ? "open" : ""}`}>
                                        <ChevronDownIcon size={16} />
                                    </span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {showChecklist && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <ul className="home-milestone-list">
                                                {milestones.map((m) => (
                                                    <li key={m.id} className={m.done ? "done" : ""}>
                                                        <span className="home-ms-mark">
                                                            {m.done && (
                                                                reduceMotion ? (
                                                                    <CheckCircleIcon size={11} strokeWidth={2.5} />
                                                                ) : (
                                                                    <motion.span
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={SPRING_SOFT}
                                                                        style={{ display: "flex" }}
                                                                    >
                                                                        <CheckCircleIcon size={11} strokeWidth={2.5} />
                                                                    </motion.span>
                                                                )
                                                            )}
                                                        </span>
                                                        <span>{m.label}</span>
                                                        <span className="home-ms-w">{m.weight}%</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>

                    <div className="dash-card">
                        <h3>Pipeline pulse</h3>
                        {loading ? (
                            <div className="dash-loading"><span className="dash-spinner" /> Loading pipeline...</div>
                        ) : !pipeline || investors.length === 0 ? (
                            <div className="pipeline-empty-board">
                                <span className="dash-empty-icon"><FunnelIcon size={20} /></span>
                                No investors tracked yet.<br />
                                <Link to="/pipeline">Start your pipeline &rarr;</Link>
                            </div>
                        ) : (
                            <>
                                <div className="pipeline-stat-row">
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{pipeline.total_active}</div>
                                        <div className="mini-label">Active</div>
                                    </div>
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{pipeline.hot_count}</div>
                                        <div className="mini-label">Hot</div>
                                    </div>
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{pipeline.closed_won_count}</div>
                                        <div className="mini-label">Won</div>
                                    </div>
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{pipeline.closed_lost_count}</div>
                                        <div className="mini-label">Lost</div>
                                    </div>
                                </div>
                                {staleInvestors.length > 0 && (
                                    <div className="home-nudge">
                                        <AlertCircleIcon size={14} />
                                        {staleInvestors.length} investor{staleInvestors.length > 1 ? "s" : ""} gone quiet
                                        — no update in {STALE_DAYS}+ days.
                                    </div>
                                )}
                                <Link className="dash-btn-secondary" to="/pipeline" style={{ marginTop: 14, display: "inline-flex" }}>
                                    View pipeline &rarr;
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="dash-card">
                        <h3>Quick actions</h3>
                        <div className="home-quick-grid">
                            {QUICK_ACTIONS.map((action) => (
                                <Link key={action.path} to={action.path} className="home-quick-tile">
                                    <span className="home-quick-label">{action.label}</span>
                                    <span className="home-quick-desc">{action.desc}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="dash-card">
                        <div className="home-coverage-head">
                            <h3>Analysis coverage</h3>
                            {!loading && (
                                <span className="home-coverage-count">{coverageDone}/{MODULE_COVERAGE.length} done</span>
                            )}
                        </div>
                        {loading ? (
                            <div className="dash-loading"><span className="dash-spinner" /> Loading...</div>
                        ) : (
                            <ul className="home-coverage-list">
                                {MODULE_COVERAGE.map((mod) => {
                                    const done = !!results[mod.key]?.result;
                                    return (
                                        <li key={mod.key} className={done ? "done" : ""}>
                                            <Link to={mod.path} className="home-coverage-link">
                                                <span className="home-coverage-mark">
                                                    {done && <CheckCircleIcon size={11} strokeWidth={2.5} />}
                                                </span>
                                                <span>{mod.label}</span>
                                            </Link>
                                            <span className={`home-coverage-badge ${done ? "done" : "pending"}`}>
                                                {done ? "Done" : "Run →"}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                <div>
                    <div className="dash-card">
                        <h3>Key numbers</h3>
                        {loading ? (
                            <div className="dash-loading"><span className="dash-spinner" /> Loading analyses...</div>
                        ) : (
                            <div className="dash-stat-grid">
                                <Link to="/valuation" className="dash-stat-tile home-stat-link">
                                    <div className="stat-value">
                                        {valuation ? `${valuation.valuation_low_formatted}\u2013${valuation.valuation_high_formatted}` : "\u2014"}
                                    </div>
                                    <div className="stat-label">{valuation ? "Valuation range" : "Run Valuation \u2192"}</div>
                                </Link>
                                <Link to="/market" className="dash-stat-tile home-stat-link">
                                    <div className="stat-value">
                                        {market ? (
                                            <span className={`dash-signal ${market.verdict === "credible" ? "warm" : market.verdict === "needs_work" ? "lukewarm" : "dead"}`}
                                                style={{ margin: 0, padding: "3px 10px", fontSize: 12 }}>
                                                {VERDICT_LABEL[market.verdict] || market.verdict}
                                            </span>
                                        ) : "\u2014"}
                                    </div>
                                    <div className="stat-label">{market ? "Market verdict" : "Run Market \u2192"}</div>
                                </Link>
                                <Link to="/finance" className="dash-stat-tile home-stat-link">
                                    <div className="stat-value">{finance ? finance.ltv_cac_formatted : "\u2014"}</div>
                                    <div className="stat-label">
                                        {finance
                                            ? <>LTV : CAC {finance.ltv_cac_ratio != null && <span className={`dash-signal ${ratioTone(finance.ltv_cac_ratio)}`} style={{ margin: 0, padding: "1px 8px", fontSize: 10 }}>{finance.ltv_cac_ratio >= 3 ? "healthy" : finance.ltv_cac_ratio >= 1 ? "thin" : "underwater"}</span>}</>
                                            : "Run Financials \u2192"}
                                    </div>
                                </Link>
                                <Link to="/finance" className="dash-stat-tile home-stat-link">
                                    <div className="stat-value">{finance?.runway_months != null ? `${finance.runway_months} mo` : "\u2014"}</div>
                                    <div className="stat-label">
                                        {finance?.runway_months != null
                                            ? <>Runway <span className={`dash-signal ${runwayTone(finance.runway_months)}`} style={{ margin: 0, padding: "1px 8px", fontSize: 10 }}>{finance.runway_months >= 12 ? "comfortable" : finance.runway_months >= 6 ? "tight" : "urgent"}</span></>
                                            : "Run Financials \u2192"}
                                    </div>
                                </Link>
                                <Link to="/gtm" className="dash-stat-tile home-stat-link">
                                    <div className="stat-value" style={{ fontSize: gtm ? 16 : 22 }}>
                                        {gtm ? (gtm.inferred_market_type || "Mapped") : "\u2014"}
                                    </div>
                                    <div className="stat-label">{gtm ? "GTM · market type" : "Run GTM \u2192"}</div>
                                </Link>
                                <Link to="/traction" className="dash-stat-tile home-stat-link">
                                    <div className="stat-value">{traction ? (traction.proof_points?.length ?? 0) : "\u2014"}</div>
                                    <div className="stat-label">{traction ? "Traction proof points" : "Run Traction \u2192"}</div>
                                </Link>
                            </div>
                        )}
                        {!loading && !valuation && !market && !finance && !gtm && !traction && (
                            <p className="kb-desc" style={{ marginTop: 14 }}>
                                Run a few analyses (Market, Valuation, Financials, GTM, Traction) and their headline numbers will show up here.
                            </p>
                        )}
                    </div>

                    <div className="dash-card">
                        <h3>Recent activity</h3>
                        {loading ? (
                            <div className="dash-loading"><span className="dash-spinner" /> Loading activity...</div>
                        ) : recentActivity.length === 0 ? (
                            <p className="kb-desc">Nothing yet — run an analysis or add an investor to see it here.</p>
                        ) : (
                            <ul className="home-activity-list">
                                {recentActivity.map((item) => (
                                    <li key={item.key}>
                                        <Link to={item.path} className="home-activity-link">
                                            <TrendingUpIcon size={13} />
                                            <span>{item.label}</span>
                                        </Link>
                                        <span className="home-activity-time">{relativeTime(item.at)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
