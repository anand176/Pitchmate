import { motion } from "framer-motion";
import { CheckIcon } from "../icons";
import { SectionHeading } from "./Features";

const STATS = [
    { value: "09", label: "SPECIALIST AGENTS" },
    { value: "PDF/DOCX", label: "DECK EXPORT" },
    { value: "E2E", label: "IDEA -> TERM SHEET" },
];

const CHECKLIST = [
    "Market sizing & competitive validation",
    "Go-to-market & ICP strategy",
    "Traction framing for early-stage founders",
    "Financial narrative & runway tracking",
    "Defensible valuation guidance",
    "Investor targeting & outreach sequences",
    "Pipeline tracking with Notion sync",
    "Meeting debrief & signal classification",
    "Due diligence Q&A preparation",
    "AI call practice with live scoring",
];

export default function Coverage() {
    return (
        <section id="coverage" style={{ padding: "96px 0" }}>
            <div className="container">
                <SectionHeading
                    eyebrow="SYSTEM_COVERAGE"
                    title="COVERAGE MOST TOOLS DON'T EVEN ATTEMPT"
                    description="Pitchmate isn't a deck generator with extra steps — it's built to carry you through every stage of raising."
                />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5 }}
                    className="cyber-card cyber-chamfer"
                    style={{
                        marginTop: 48,
                        display: "flex",
                        flexWrap: "wrap",
                    }}
                >
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            style={{
                                flex: "1 1 200px",
                                textAlign: "center",
                                padding: "32px 20px",
                                borderLeft: i === 0 ? "none" : "1px solid var(--border)",
                            }}
                        >
                            <div
                                className="neon-text"
                                style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800 }}
                            >
                                {s.value}
                            </div>
                            <div
                                style={{
                                    fontSize: 11.5,
                                    letterSpacing: "0.14em",
                                    color: "var(--muted-foreground)",
                                    marginTop: 10,
                                }}
                            >
                                {s.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6 }}
                    className="cyber-card cyber-chamfer"
                    style={{ marginTop: 20 }}
                >
                    <div className="cyber-terminal-header">
                        <span className="cyber-terminal-dot" style={{ background: "var(--destructive)" }} />
                        <span className="cyber-terminal-dot" style={{ background: "#ffb800" }} />
                        <span className="cyber-terminal-dot" style={{ background: "var(--accent)" }} />
                        <span
                            style={{
                                marginLeft: 8,
                                fontSize: 10.5,
                                color: "var(--muted-foreground)",
                                letterSpacing: "0.1em",
                            }}
                        >
                            coverage.log
                        </span>
                    </div>
                    <div
                        style={{
                            padding: "30px 32px",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: "16px 32px",
                        }}
                    >
                        {CHECKLIST.map((item) => (
                            <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 20,
                                        height: 20,
                                        background: "rgba(0,255,136,0.12)",
                                        border: "1px solid var(--accent)",
                                        flexShrink: 0,
                                    }}
                                >
                                    <CheckIcon width={12} height={12} stroke="var(--accent)" />
                                </span>
                                <span style={{ fontSize: 13.5, color: "var(--foreground)" }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
