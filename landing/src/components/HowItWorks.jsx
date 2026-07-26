import { motion } from "framer-motion";
import { SectionHeading } from "./Features";

const STEPS = [
    {
        step: "01",
        title: "UPLINK YOUR STARTUP",
        description:
            "A short onboarding — stage, industry, what you're building. That context feeds every agent from here on.",
    },
    {
        step: "02",
        title: "QUERY ANY AGENT",
        description:
            "Market sizing, traction framing, valuation, investor targeting, due diligence prep — one conversation, routed automatically.",
    },
    {
        step: "03",
        title: "DEPLOY & EXECUTE",
        description:
            "Download an investor-ready deck, sync your pipeline, and rehearse the call before you're in the room.",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" style={{ padding: "96px 0" }}>
            <div className="container">
                <SectionHeading
                    eyebrow="EXECUTION_PROTOCOL"
                    title="FROM IDEA TO TERM SHEET, ONE FLOW"
                    description="No juggling five tools — one context, carried through every step."
                />

                <div
                    style={{
                        marginTop: 56,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: 24,
                        position: "relative",
                    }}
                >
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.step}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                            className="cyber-card cyber-card--hover cyber-chamfer"
                            style={{ padding: 32, position: "relative" }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 20,
                                    fontFamily: "var(--font-body)",
                                    fontSize: 11,
                                    color: "var(--muted-foreground)",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                [{i + 1}/3]
                            </span>
                            <span
                                className="neon-text"
                                style={{ fontFamily: "var(--font-heading)", fontSize: 36, fontWeight: 800 }}
                            >
                                {s.step}
                            </span>
                            <h3
                                style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: 15.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    margin: "18px 0 10px",
                                }}
                            >
                                {s.title}
                            </h3>
                            <p style={{ fontSize: 13.5, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.75 }}>
                                {s.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
