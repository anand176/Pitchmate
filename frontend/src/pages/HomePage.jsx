import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { apiGetReadiness } from "../pitchmateApi";
import { CheckCircleIcon, MessageCircleIcon } from "../icons";

/**
 * Dashboard home — readiness progress + single Next action CTA.
 */
export default function HomePage() {
    const { profile, openChat } = useOutletContext();
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const r = await apiGetReadiness();
                if (!cancelled) setReadiness(r);
            } catch {
                if (!cancelled) setReadiness(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [profile?.updated_at, profile?.company_name, profile?.product_description]);

    const name = profile?.company_name || "Founder";
    const stage = (profile?.lifecycle_stage || "idea").replace(/_/g, " ");
    const percent = readiness?.overall_percent ?? 0;
    const next = readiness?.next_action || "Complete your startup profile";
    const nextPath = readiness?.next_action_path || "/onboarding";

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
                <div className="dash-card home-progress-card">
                    <h3>Pitch readiness</h3>
                    {loading ? (
                        <div className="dash-loading"><span className="dash-spinner" /> Loading progress...</div>
                    ) : (
                        <>
                            <div className="home-progress-meta">
                                <span className="home-progress-pct">{percent}%</span>
                                <span className="home-progress-label">complete</span>
                            </div>
                            <div className="home-progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                                <div className="home-progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
                            </div>
                            <ul className="home-milestone-list">
                                {(readiness?.milestones || []).map((m) => (
                                    <li key={m.id} className={m.done ? "done" : ""}>
                                        <span className="home-ms-mark">{m.done && <CheckCircleIcon size={11} strokeWidth={2.5} />}</span>
                                        <span>{m.label}</span>
                                        <span className="home-ms-w">{m.weight}%</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                <div className="dash-card home-next-card">
                    <h3>Next action</h3>
                    <p className="home-next-copy">{next}</p>
                    <div className="home-next-actions">
                        <Link className="dash-btn-primary" to={nextPath} style={{ textDecoration: "none", display: "inline-block" }}>
                            Continue
                        </Link>
                        {profile?.profile_complete && (
                            <button type="button" className="dash-btn-ghost" onClick={() => openChat?.()}>
                                <MessageCircleIcon size={14} />
                                Ask Pitchmate
                            </button>
                        )}
                    </div>
                    {!profile?.profile_complete && (
                        <p className="kb-desc" style={{ marginTop: 16 }}>
                            Soft gate: finish name, problem, solution, and stage in onboarding for best results.
                            You can still browse tabs — agents work better with a profile.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
