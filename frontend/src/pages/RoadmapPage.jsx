import { useCallback, useEffect, useMemo, useState } from "react";
import {
    apiGetRoadmapColumns, apiListRoadmapItems, apiCreateRoadmapItem,
    apiUpdateRoadmapItem, apiMoveRoadmapItem, apiDeleteRoadmapItem, apiGenerateRoadmapItems,
} from "../pitchmateApi";
import { PlusIcon, CloseIcon, MapIcon } from "../icons";
import { useDashboardContext } from "../dashboardContext";

const STATUS_LABELS = { planned: "Planned", in_progress: "In progress", shipped: "Shipped" };
const STATUS_ORDER = ["planned", "in_progress", "shipped"];

/**
 * Roadmap board — a team-shared kanban of feature cards across dynamically
 * computed quarter columns (Backlog, current + next 3 quarters, Later).
 * Drag a card onto a column to move it there (native HTML5 DnD, no extra
 * dependency). Shared with cofounders via team_id, same as Pipeline.
 */
export default function RoadmapPage() {
    const { notify } = useDashboardContext();
    const [columns, setColumns] = useState([]);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openAddFor, setOpenAddFor] = useState(null);
    const [addForm, setAddForm] = useState({ title: "", category: "" });
    const [adding, setAdding] = useState(false);
    const [dragItemId, setDragItemId] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

    const [aiOpen, setAiOpen] = useState(false);
    const [aiFocus, setAiFocus] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [aiSelected, setAiSelected] = useState(() => new Set());
    const [aiSaving, setAiSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [cols, rows] = await Promise.all([apiGetRoadmapColumns(), apiListRoadmapItems()]);
            setColumns(cols.columns || []);
            setCategories(cols.categories || []);
            setItems(Array.isArray(rows) ? rows : []);
        } catch (err) {
            setError(err.message || "Could not load the roadmap.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const byColumn = useMemo(() => {
        const map = {};
        for (const col of columns) map[col.key] = [];
        for (const item of items) {
            if (!map[item.quarter]) map[item.quarter] = [];
            map[item.quarter].push(item);
        }
        for (const key of Object.keys(map)) map[key].sort((a, b) => a.position - b.position);
        return map;
    }, [columns, items]);

    const openAdd = (columnKey) => {
        setOpenAddFor(columnKey);
        setAddForm({ title: "", category: "" });
    };

    const submitAdd = async (e, columnKey) => {
        e.preventDefault();
        if (!addForm.title.trim() || adding) return;
        setAdding(true); setError("");
        try {
            const created = await apiCreateRoadmapItem({
                title: addForm.title.trim(),
                category: addForm.category || null,
                quarter: columnKey,
            });
            setItems((prev) => [...prev, created]);
            setOpenAddFor(null);
        } catch (err) {
            setError(err.message || "Could not add the card.");
        } finally {
            setAdding(false);
        }
    };

    const cycleStatus = async (item) => {
        const next = STATUS_ORDER[(STATUS_ORDER.indexOf(item.status) + 1) % STATUS_ORDER.length];
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
        try {
            await apiUpdateRoadmapItem(item.id, { status: next });
        } catch (err) {
            setError(err.message || "Could not update status.");
            load();
        }
    };

    const removeItem = async (id) => {
        const prev = items;
        setItems((p) => p.filter((i) => i.id !== id));
        try {
            await apiDeleteRoadmapItem(id);
        } catch (err) {
            setError(err.message || "Could not remove the card.");
            setItems(prev);
        }
    };

    const handleDrop = async (columnKey) => {
        setDragOverColumn(null);
        const id = dragItemId;
        setDragItemId(null);
        if (!id) return;
        const item = items.find((i) => i.id === id);
        if (!item || item.quarter === columnKey) return;
        const targetItems = byColumn[columnKey] || [];
        const nextPosition = targetItems.length ? Math.max(...targetItems.map((i) => i.position)) + 1 : 1;
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quarter: columnKey, position: nextPosition } : i)));
        try {
            await apiMoveRoadmapItem(id, columnKey, nextPosition);
            notify?.(`Moved to ${columns.find((c) => c.key === columnKey)?.label || columnKey}`);
        } catch (err) {
            setError(err.message || "Could not move the card.");
            load();
        }
    };

    const openGenerate = () => {
        setAiOpen(true);
        setAiSuggestions(null);
        setAiError("");
        setAiFocus("");
    };

    const runGenerate = async () => {
        setAiLoading(true); setAiError("");
        try {
            const data = await apiGenerateRoadmapItems(aiFocus.trim(), 6);
            const suggested = Array.isArray(data?.items) ? data.items : [];
            setAiSuggestions(suggested);
            setAiSelected(new Set(suggested.map((_, i) => i)));
        } catch (err) {
            setAiError(err.message || "Could not generate suggestions.");
        } finally {
            setAiLoading(false);
        }
    };

    const toggleSuggestion = (idx) => {
        setAiSelected((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx); else next.add(idx);
            return next;
        });
    };

    const addSelectedSuggestions = async () => {
        if (!aiSuggestions || aiSelected.size === 0) return;
        setAiSaving(true); setAiError("");
        try {
            const toAdd = aiSuggestions.filter((_, i) => aiSelected.has(i));
            const created = await Promise.all(toAdd.map((s) => apiCreateRoadmapItem({
                title: s.title,
                description: s.description || null,
                category: s.category || null,
                quarter: s.quarter || "backlog",
            })));
            setItems((prev) => [...prev, ...created]);
            notify?.(`Added ${created.length} card${created.length > 1 ? "s" : ""} to the roadmap`);
            setAiOpen(false);
        } catch (err) {
            setAiError(err.message || "Could not add the selected cards.");
        } finally {
            setAiSaving(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <div>
                    <h2>Roadmap</h2>
                    <p>Drag feature cards between quarters to plan what ships when — shared with your whole team.</p>
                </div>
                <button
                    type="button"
                    className="dash-btn-primary"
                    style={{ width: "auto", flexShrink: 0, whiteSpace: "nowrap" }}
                    onClick={openGenerate}
                >
                    Generate with AI Agent
                </button>
            </div>

            {error && <div className="dash-error" style={{ marginBottom: 14 }}>{error}</div>}

            {loading ? (
                <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Loading roadmap...</div></div>
            ) : (
                <div className="roadmap-board">
                    {columns.map((col) => {
                        const colItems = byColumn[col.key] || [];
                        return (
                            <div
                                key={col.key}
                                className={`roadmap-column ${dragOverColumn === col.key ? "drag-over" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
                                onDragLeave={() => setDragOverColumn((c) => (c === col.key ? null : c))}
                                onDrop={(e) => { e.preventDefault(); handleDrop(col.key); }}
                            >
                                <div className="roadmap-column-head">
                                    <span>{col.label}</span>
                                    <button type="button" className="roadmap-add-btn" onClick={() => openAdd(col.key)} title="Add card">
                                        <PlusIcon size={14} />
                                    </button>
                                </div>

                                {openAddFor === col.key && (
                                    <form className="roadmap-add-form" onSubmit={(e) => submitAdd(e, col.key)}>
                                        <input
                                            className="dash-input"
                                            autoFocus
                                            placeholder="Card title..."
                                            value={addForm.title}
                                            onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                                        />
                                        <select
                                            className="dash-select"
                                            value={addForm.category}
                                            onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                                        >
                                            <option value="">No category</option>
                                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <div className="roadmap-add-actions">
                                            <button type="submit" className="dash-btn-primary" disabled={!addForm.title.trim() || adding}>
                                                {adding ? "Adding..." : "Add"}
                                            </button>
                                            <button type="button" className="dash-btn-secondary" onClick={() => setOpenAddFor(null)}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {colItems.length === 0 && openAddFor !== col.key && (
                                    <div className="roadmap-empty-col">No cards yet</div>
                                )}

                                {colItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`roadmap-card status-${item.status}`}
                                        draggable
                                        onDragStart={() => setDragItemId(item.id)}
                                        onDragEnd={() => { setDragItemId(null); setDragOverColumn(null); }}
                                    >
                                        <div className="roadmap-card-top">
                                            <span className="roadmap-card-title">{item.title}</span>
                                            <button type="button" className="roadmap-card-close" onClick={() => removeItem(item.id)}>
                                                <CloseIcon size={12} />
                                            </button>
                                        </div>
                                        {item.description && <p className="roadmap-card-desc">{item.description}</p>}
                                        <div className="roadmap-card-foot">
                                            {item.category && <span className="roadmap-card-tag">{item.category}</span>}
                                            <button type="button" className={`roadmap-status-btn ${item.status}`} onClick={() => cycleStatus(item)}>
                                                {STATUS_LABELS[item.status]}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && items.length === 0 && (
                <div className="dash-card" style={{ marginTop: 14 }}>
                    <div className="pipeline-empty-board">
                        <span className="dash-empty-icon"><MapIcon size={20} /></span>
                        Add your first card to a column above to start planning your roadmap, or generate a starting set with AI.
                    </div>
                </div>
            )}

            {aiOpen && (
                <div className="dash-modal-overlay" onClick={() => !aiLoading && !aiSaving && setAiOpen(false)}>
                    <div className="dash-modal ai-generate-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dash-modal-head">
                            <h3>Generate roadmap with AI Agent</h3>
                            <button type="button" className="roadmap-card-close" onClick={() => setAiOpen(false)}>
                                <CloseIcon size={13} />
                            </button>
                        </div>

                        {!aiSuggestions ? (
                            <>
                                <p className="kb-desc">
                                    Uses your startup profile, GTM plan, and market notes to suggest concrete next-step
                                    cards — spread sensibly across quarters. Nothing is added until you pick which ones to keep.
                                </p>
                                <div className="dash-field">
                                    <label>Steer it (optional)</label>
                                    <input
                                        className="dash-input"
                                        placeholder="e.g. focus on GTM and hiring, not product"
                                        value={aiFocus}
                                        onChange={(e) => setAiFocus(e.target.value)}
                                    />
                                </div>
                                {aiError && <div className="dash-error">{aiError}</div>}
                                <button type="button" className="dash-btn-primary" onClick={runGenerate} disabled={aiLoading}>
                                    {aiLoading ? "Generating..." : "Generate suggestions"}
                                </button>
                            </>
                        ) : (
                            <>
                                {aiSuggestions.length === 0 ? (
                                    <p className="kb-desc">No suggestions came back — try again with a different steer.</p>
                                ) : (
                                    <ul className="ai-suggestion-list">
                                        {aiSuggestions.map((s, i) => (
                                            <li key={i} className={aiSelected.has(i) ? "selected" : ""}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={aiSelected.has(i)}
                                                        onChange={() => toggleSuggestion(i)}
                                                    />
                                                    <div>
                                                        <div className="ai-suggestion-title">
                                                            {s.title}
                                                            {s.category && <span className="roadmap-card-tag">{s.category}</span>}
                                                            <span className="dash-tag">{s.quarter}</span>
                                                        </div>
                                                        {s.description && <p className="ai-suggestion-desc">{s.description}</p>}
                                                    </div>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {aiError && <div className="dash-error">{aiError}</div>}
                                <div className="roadmap-add-actions" style={{ marginTop: 6 }}>
                                    <button
                                        type="button"
                                        className="dash-btn-primary"
                                        style={{ width: "auto" }}
                                        disabled={aiSelected.size === 0 || aiSaving}
                                        onClick={addSelectedSuggestions}
                                    >
                                        {aiSaving ? "Adding..." : `Add ${aiSelected.size} card${aiSelected.size === 1 ? "" : "s"}`}
                                    </button>
                                    <button type="button" className="dash-btn-secondary" onClick={runGenerate} disabled={aiLoading || aiSaving}>
                                        {aiLoading ? "Regenerating..." : "Regenerate"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
