import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPreviewTeamInvite, apiAcceptTeamInvite } from "../pitchmateApi";
import { UsersIcon, CheckCircleIcon } from "../icons";
import { useDashboardContext } from "../dashboardContext";

/**
 * Landing page for a team invite link (/join?token=...). Shows who invited
 * you before switching your workspace, since accepting replaces what you see
 * everywhere (StartupProfile/pipeline/roadmap/runway) with the inviter's team.
 */
export default function JoinTeamPage() {
    const navigate = useNavigate();
    const { refreshProfile } = useDashboardContext();
    const token = new URLSearchParams(window.location.search).get("token");

    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        if (!token) { setError("This invite link is missing a token."); setLoading(false); return; }
        (async () => {
            try {
                const data = await apiPreviewTeamInvite(token);
                setPreview(data);
                if (!data.valid) setError(data.reason || "This invite link is no longer valid.");
            } catch (err) {
                setError(err.message || "Could not check this invite link.");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const handleJoin = async () => {
        setJoining(true); setError("");
        try {
            await apiAcceptTeamInvite(token);
            setJoined(true);
            await refreshProfile?.();
            setTimeout(() => navigate("/"), 1400);
        } catch (err) {
            setError(err.message || "Could not join the team.");
        } finally {
            setJoining(false);
        }
    };

    return (
        <div style={{ maxWidth: 480, margin: "40px auto" }}>
            <div className="dash-card" style={{ textAlign: "center" }}>
                <div className="dash-empty-icon" style={{ margin: "0 auto 14px" }}>
                    {joined ? <CheckCircleIcon size={22} /> : <UsersIcon size={22} />}
                </div>

                {loading ? (
                    <div className="dash-loading" style={{ justifyContent: "center" }}>
                        <span className="dash-spinner" /> Checking invite...
                    </div>
                ) : joined ? (
                    <>
                        <h3 style={{ marginBottom: 6 }}>You're in</h3>
                        <p className="kb-desc">Taking you to the shared workspace...</p>
                    </>
                ) : error ? (
                    <>
                        <h3 style={{ marginBottom: 6 }}>Can't join this team</h3>
                        <p className="kb-desc">{error}</p>
                        <button type="button" className="dash-btn-secondary" onClick={() => navigate("/")}>
                            Back to dashboard
                        </button>
                    </>
                ) : preview?.already_on_team ? (
                    <>
                        <h3 style={{ marginBottom: 6 }}>You're already on this team</h3>
                        <p className="kb-desc">{preview.member_count} member{preview.member_count === 1 ? "" : "s"} share this workspace.</p>
                        <button type="button" className="dash-btn-primary" onClick={() => navigate("/")}>
                            Go to dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <h3 style={{ marginBottom: 6 }}>Join your cofounder's workspace?</h3>
                        <p className="kb-desc">
                            {preview?.invited_by_email ? <><b>{preview.invited_by_email}</b> invited you to </> : "You've been invited to "}
                            share their startup profile, fundraise pipeline, roadmap, and runway tracker
                            {preview?.member_count ? ` (currently ${preview.member_count} member${preview.member_count === 1 ? "" : "s"})` : ""}.
                        </p>
                        <p className="kb-desc" style={{ fontSize: 12, marginTop: -4 }}>
                            This replaces your current workspace view — any solo data you've entered won't be merged in.
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
                            <button type="button" className="dash-btn-primary" disabled={joining} onClick={handleJoin}>
                                {joining ? "Joining..." : "Join team"}
                            </button>
                            <button type="button" className="dash-btn-secondary" onClick={() => navigate("/")}>
                                Not now
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
