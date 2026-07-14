import { useState } from "react";
import { apiDashboardDeck, apiDashboardDeckExport, apiDownloadArtifact } from "../pitchmateApi";
import { FileTextIcon } from "../icons";

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

export default function DeckPage() {
    const [companyName, setCompanyName] = useState("");
    const [sections, setSections] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    const updateSection = (key, value) => setSections((s) => ({ ...s, [key]: value }));
    const canSubmit = companyName.trim();

    const buildPayload = () => ({
        company_name: companyName.trim() || "Product Deck",
        ...Object.fromEntries(Object.entries(sections).filter(([, v]) => (v || "").trim())),
    });

    const handleDraft = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardDeck(buildPayload());
            setResult(data);
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
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Drafting..." : "Draft Section Copy"}
                    </button>
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
                        <div className="dash-card">
                            <h3 style={{ marginBottom: 4 }}>{result.company_name}</h3>
                            {result.sections?.map((s) => (
                                <div key={s.key} style={{ marginBottom: 14 }}>
                                    <div className="dash-section-title">{s.title}</div>
                                    <p style={{ fontSize: 13, color: "#9AA3B2", lineHeight: 1.6 }}>{s.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
