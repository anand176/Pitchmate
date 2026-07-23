import { useEffect, useState } from "react";
import { apiDashboardDeck, apiDashboardDeckExport, apiDownloadArtifact } from "../pitchmateApi";
import { FileTextIcon, SparklesIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";
import { ResultCard, Section, MotionButton } from "../motion";

const SECTION_FIELDS = [
    { key: "problem", label: "Problem" },
    { key: "solution", label: "Solution" },
    { key: "market_size", label: "Market Size" },
    { key: "product", label: "Product" },
    { key: "traction", label: "Traction" },
    { key: "business_model", label: "Business Model" },
    { key: "gtm_strategy", label: "GTM Strategy" },
    { key: "competition", label: "Competition" },
];

/**
 * Turn the user's profile + already-run analyses into starting deck section
 * content, so the founder refines rather than re-types. This is the cross-page
 * flow — Market/GTM/Competition results feed the matching deck slides.
 */
function deriveSectionsFrom(profile, allResults) {
    const out = {};
    if (profile?.problem) out.problem = profile.problem;
    if (profile?.solution) out.solution = profile.solution;
    if (profile?.product_description) out.product = profile.product_description;

    const market = allResults?.market;
    if (market?.inputs) {
        const { tam, sam, som } = market.inputs;
        const parts = [tam && `TAM ${tam}`, sam && `SAM ${sam}`, som && `SOM ${som}`].filter(Boolean);
        if (parts.length) out.market_size = `${parts.join(" · ")}.`;
    }
    const gtm = allResults?.gtm?.result;
    if (gtm) {
        const bits = [gtm.primary_icp, gtm.recommended_sales_motion,
            gtm.suggested_channels?.length ? `Channels: ${gtm.suggested_channels.join(", ")}.` : ""]
            .filter(Boolean);
        if (bits.length) out.gtm_strategy = bits.join(" ");
    }
    const comp = allResults?.competition?.result;
    if (comp?.suggested_moat) out.competition = `Moat: ${comp.suggested_moat}`;
    return out;
}

export default function DeckPage() {
    const { profile, saved, allResults, loadingSaved, reportRun } = useAnalysisModule("deck");
    const [companyName, setCompanyName] = useState("");
    const [sections, setSections] = useState({});
    const [result, setResult] = useState(null);
    const [resultVersion, setResultVersion] = useState(0);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        setCompanyName(saved?.inputs?.company_name || profile?.company_name || "");
        // Saved deck inputs win; otherwise seed from profile + analyses.
        const savedSections = saved?.inputs
            ? Object.fromEntries(SECTION_FIELDS.map(({ key }) => [key, saved.inputs[key]]).filter(([, v]) => v))
            : {};
        const seeded = Object.keys(savedSections).length ? savedSections : deriveSectionsFrom(profile, allResults);
        setSections(seeded);
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        setHydrated(true);
    }, [loadingSaved, saved, profile, allResults, hydrated]);

    const hasPullable = Boolean(
        profile?.problem || profile?.solution || profile?.product_description ||
        allResults?.market || allResults?.gtm || allResults?.competition
    );

    const updateSection = (key, value) => setSections((s) => ({ ...s, [key]: value }));
    const canSubmit = companyName.trim();

    const pullFromData = () => {
        const derived = deriveSectionsFrom(profile, allResults);
        setSections((s) => ({ ...derived, ...s })); // don't clobber anything already typed
        if (!companyName.trim() && profile?.company_name) setCompanyName(profile.company_name);
    };

    const buildPayload = () => ({
        company_name: companyName.trim() || "Product Deck",
        ...Object.fromEntries(Object.entries(sections).filter(([, v]) => (v || "").trim())),
    });

    const handleDraft = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const payload = buildPayload();
            const data = await apiDashboardDeck(payload);
            setResult(data);
            setResultVersion((v) => v + 1);
            setLastRun(new Date().toISOString());
            reportRun(data, payload);
        } catch (err) {
            setError(err.message || "Deck drafting failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        if (!canSubmit || exporting) return;
        setExporting(true); setError("");
        try {
            const payload = result
                ? { company_name: result.company_name, ...Object.fromEntries(result.sections.map((s) => [s.key, s.content])) }
                : buildPayload();
            const { filename } = await apiDashboardDeckExport(payload, format);
            await apiDownloadArtifact(filename);
        } catch (err) {
            setError(err.message || "Deck export failed.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Deck Builder</h2>
                <p>Draft investor-ready section copy, then export as a PDF or DOCX deck.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleDraft}>
                    <h3>Deck content</h3>
                    {hasPullable && (
                        <button type="button" className="dash-btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 14 }} onClick={pullFromData}>
                            <SparklesIcon size={14} />
                            Pull from my profile &amp; analyses
                        </button>
                    )}
                    <div className="dash-field">
                        <label>Company name</label>
                        <input className="dash-input" placeholder="Pitchmate" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    {SECTION_FIELDS.map(({ key, label }) => (
                        <div className="dash-field" key={key}>
                            <label>{label} <span style={{ opacity: 0.5 }}>(optional)</span></label>
                            <textarea className="dash-textarea" placeholder={`Notes on ${label.toLowerCase()}... leave blank to get a placeholder prompt`}
                                value={sections[key] || ""} onChange={(e) => updateSection(key, e.target.value)} rows={2} />
                        </div>
                    ))}
                    <MotionButton type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Drafting..." : "Draft Section Copy"}
                    </MotionButton>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button type="button" className="dash-btn-secondary" style={{ flex: 1 }} disabled={!canSubmit || exporting} onClick={() => handleExport("pdf")}>
                            {exporting ? "Exporting..." : "Export PDF"}
                        </button>
                        <button type="button" className="dash-btn-secondary" style={{ flex: 1 }} disabled={!canSubmit || exporting} onClick={() => handleExport("docx")}>
                            {exporting ? "Exporting..." : "Export DOCX"}
                        </button>
                    </div>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Drafting deck sections...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><FileTextIcon size={20} /></span>Fill in whatever deck content you have and draft polished, investor-ready copy, or export directly from your own notes.</div></div>
                    )}
                    {result && (
                        <ResultCard key={resultVersion} animate={resultVersion > 0}>
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}
                            <h3 style={{ marginBottom: 4 }}>{result.company_name}</h3>
                            {result.sections?.map((s) => (
                                <Section key={s.key} style={{ marginBottom: 14 }}>
                                    <div className="dash-section-title">{s.title}</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{s.content}</p>
                                </Section>
                            ))}
                        </ResultCard>
                    )}
                </div>
            </div>
        </div>
    );
}
