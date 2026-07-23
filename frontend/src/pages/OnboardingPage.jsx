import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    apiGetProfile,
    apiUpdateProfile,
    apiUploadDocumentFile,
    apiSaveContext,
} from "../pitchmateApi";
import { useDashboardContext } from "../dashboardContext";

const STAGES = [
    { value: "idea", label: "Idea" },
    { value: "validating", label: "Validating" },
    { value: "building", label: "Building" },
    { value: "pre_revenue", label: "Pre-revenue" },
    { value: "revenue", label: "Revenue" },
    { value: "raising", label: "Raising" },
    { value: "angel_backed", label: "Angel-backed" },
    { value: "seed_closed", label: "Seed closed" },
    { value: "series_a_plus", label: "Series A+" },
];

const EMPTY = {
    company_name: "",
    one_liner: "",
    industry: "",
    lifecycle_stage: "idea",
    problem: "",
    solution: "",
    product_description: "",
};

/**
 * 3-screen profile wizard:
 * 1) Identity + stage  2) Problem + solution  3) Product describe + uploads
 * Skip is blocked until core fields (name, problem, solution, stage) are set.
 */
export default function OnboardingPage() {
    const navigate = useNavigate();
    const { sessionId, setSessionId, refreshProfile } = useDashboardContext();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [uploadNote, setUploadNote] = useState("");
    const deckRef = useRef(null);
    const archRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        apiGetProfile()
            .then((p) => {
                setForm({
                    company_name: p.company_name || "",
                    one_liner: p.one_liner || "",
                    industry: p.industry || "",
                    lifecycle_stage: p.lifecycle_stage || "idea",
                    problem: p.problem || "",
                    solution: p.solution || "",
                    product_description: p.product_description || "",
                });
                if (p.has_deck_upload || p.has_architecture_upload || p.architecture_image_name) {
                    setUploadNote("Prior uploads detected.");
                }
            })
            .catch(() => { });
    }, []);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const coreReady =
        form.company_name.trim() &&
        form.problem.trim() &&
        form.solution.trim() &&
        form.lifecycle_stage;

    const persist = async (extra = {}) => {
        setSaving(true);
        setError("");
        try {
            const saved = await apiUpdateProfile({ ...form, ...extra });
            // Keep chat session context in sync with a short summary
            const summary = [
                saved.company_name && `Company: ${saved.company_name}`,
                saved.lifecycle_stage && `Stage: ${saved.lifecycle_stage}`,
                saved.problem && `Problem: ${saved.problem}`,
                saved.solution && `Solution: ${saved.solution}`,
                saved.product_description && `Product: ${saved.product_description}`,
            ].filter(Boolean).join("\n");
            if (summary) {
                try {
                    const ctx = await apiSaveContext(summary, sessionId);
                    if (ctx.session_id && setSessionId) setSessionId(ctx.session_id);
                } catch { /* non-fatal */ }
            }
            if (refreshProfile) await refreshProfile();
            return saved;
        } catch (e) {
            setError(e.message || "Could not save profile.");
            throw e;
        } finally {
            setSaving(false);
        }
    };

    const goNext = async () => {
        if (step === 0 && !form.company_name.trim()) {
            setError("Company name is required.");
            return;
        }
        if (step === 1 && (!form.problem.trim() || !form.solution.trim())) {
            setError("Problem and solution are required.");
            return;
        }
        setError("");
        try {
            await persist();
            setStep((s) => Math.min(s + 1, 2));
        } catch { /* error already set */ }
    };

    const finish = async () => {
        if (!coreReady) {
            setError("Name, problem, solution, and stage are required before finishing.");
            return;
        }
        try {
            await persist({ wizard_completed: true });
            navigate("/", { replace: true });
        } catch { /* error already set */ }
    };

    const finishLater = async () => {
        if (!coreReady) return;
        try {
            await persist({ wizard_completed: true, onboarding_dismissed: true });
            navigate("/", { replace: true });
        } catch { /* error already set */ }
    };

    const handleDeckUpload = async (e, kind) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const ext = (file.name || "").toLowerCase();
        if (!ext.endsWith(".pdf") && !ext.endsWith(".docx")) {
            setError("Only PDF and DOCX files are allowed for documents.");
            return;
        }
        setUploading(true);
        setError("");
        try {
            const source =
                kind === "deck"
                    ? `pitch_deck_${file.name}`
                    : `architecture_${file.name}`;
            await apiUploadDocumentFile(file, source);
            await persist(
                kind === "deck"
                    ? { has_deck_upload: true }
                    : { has_architecture_upload: true }
            );
            setUploadNote(
                kind === "deck"
                    ? `Deck "${file.name}" uploaded to knowledge base.`
                    : `Architecture doc "${file.name}" uploaded.`
            );
        } catch (err) {
            setError(err.message || "Upload failed.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleImageUpload = async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }
        setUploading(true);
        setError("");
        try {
            await persist({
                architecture_image_name: file.name,
                has_architecture_upload: true,
                product_description:
                    form.product_description.trim() ||
                    `Architecture diagram uploaded: ${file.name}`,
            });
            setUploadNote(`Diagram "${file.name}" noted on your profile.`);
        } catch (err) {
            setError(err.message || "Could not save image reference.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div className="onboard-wrap">
            <div className="dash-page-header">
                <h2>Startup profile</h2>
                <p>Three quick steps so Pitchmate can coach you with real context.</p>
            </div>

            <div className="onboard-steps" aria-label="Onboarding progress">
                {["Identity", "Problem & solution", "Product"].map((label, i) => (
                    <div key={label} className={`onboard-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
                        <span className="onboard-step-num">0{i + 1}</span>
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            <div className="dash-card onboard-card">
                {step === 0 && (
                    <>
                        <h3>Who are you building?</h3>
                        <div className="dash-field">
                            <label>Company name *</label>
                            <input className="dash-input" value={form.company_name}
                                onChange={(e) => update("company_name", e.target.value)}
                                placeholder="Acme AI" />
                        </div>
                        <div className="dash-field">
                            <label>One-liner</label>
                            <input className="dash-input" value={form.one_liner}
                                onChange={(e) => update("one_liner", e.target.value)}
                                placeholder="AI co-pilot that makes founders investor-ready" />
                        </div>
                        <div className="dash-field">
                            <label>Industry</label>
                            <input className="dash-input" value={form.industry}
                                onChange={(e) => update("industry", e.target.value)}
                                placeholder="B2B SaaS, fintech, healthtech..." />
                        </div>
                        <div className="dash-field">
                            <label>Current stage *</label>
                            <div className="onboard-stage-grid">
                                {STAGES.map((s) => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        className={`onboard-stage-btn ${form.lifecycle_stage === s.value ? "active" : ""}`}
                                        onClick={() => update("lifecycle_stage", s.value)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {step === 1 && (
                    <>
                        <h3>What problem, what solution?</h3>
                        <div className="dash-field">
                            <label>Problem *</label>
                            <textarea className="dash-textarea" rows={4} value={form.problem}
                                onChange={(e) => update("problem", e.target.value)}
                                placeholder="What pain do founders / customers feel today?" />
                        </div>
                        <div className="dash-field">
                            <label>Solution *</label>
                            <textarea className="dash-textarea" rows={4} value={form.solution}
                                onChange={(e) => update("solution", e.target.value)}
                                placeholder="How does your product solve it?" />
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h3>Describe your product</h3>
                        <p className="kb-desc" style={{ marginTop: 0 }}>
                            Text, deck PDF, architecture doc, or a diagram image — whatever you have.
                        </p>
                        <div className="dash-field">
                            <label>Product / architecture notes</label>
                            <textarea className="dash-textarea" rows={5} value={form.product_description}
                                onChange={(e) => update("product_description", e.target.value)}
                                placeholder="How the product works, key modules, tech stack, user journey..." />
                        </div>

                        <div className="onboard-upload-row">
                            <input ref={deckRef} type="file" accept=".pdf,.docx" hidden
                                onChange={(e) => handleDeckUpload(e, "deck")} />
                            <input ref={archRef} type="file" accept=".pdf,.docx" hidden
                                onChange={(e) => handleDeckUpload(e, "architecture")} />
                            <input ref={imageRef} type="file" accept="image/*" hidden
                                onChange={handleImageUpload} />
                            <button type="button" className="dash-btn-ghost" disabled={uploading}
                                onClick={() => deckRef.current?.click()}>
                                {uploading ? "Uploading..." : "Upload deck PDF"}
                            </button>
                            <button type="button" className="dash-btn-ghost" disabled={uploading}
                                onClick={() => archRef.current?.click()}>
                                Upload architecture PDF
                            </button>
                            <button type="button" className="dash-btn-ghost" disabled={uploading}
                                onClick={() => imageRef.current?.click()}>
                                Upload diagram image
                            </button>
                        </div>
                        {uploadNote && <p className="kb-msg success">{uploadNote}</p>}
                    </>
                )}

                {error && <div className="dash-error">{error}</div>}

                <div className="onboard-actions">
                    {step > 0 && (
                        <button type="button" className="dash-btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={saving}>
                            Back
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    {step < 2 ? (
                        <button type="button" className="dash-btn-primary" onClick={goNext} disabled={saving}>
                            {saving ? "Saving..." : "Continue"}
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="dash-btn-ghost"
                                onClick={finishLater}
                                disabled={!coreReady || saving}
                                title={coreReady ? "Save and open dashboard" : "Fill name, problem, solution, stage first"}
                            >
                                Finish later
                            </button>
                            <button type="button" className="dash-btn-primary" onClick={finish} disabled={!coreReady || saving}>
                                {saving ? "Saving..." : "Enter dashboard"}
                            </button>
                        </>
                    )}
                </div>
                {!coreReady && step === 2 && (
                    <p className="kb-desc">Finish later is unlocked after name, problem, solution, and stage are set.</p>
                )}
            </div>
        </div>
    );
}
