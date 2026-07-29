import { motion } from "framer-motion";
import { SectionHeading } from "./Features";
import AnimatedCounter from "./AnimatedCounter";
import { EASE, springHover } from "../motion";
import { handleCursorGlow } from "../cursorGlow";

const STEPS = [
    {
        step: 1,
        title: "UPLINK YOUR STARTUP",
        description:
            "A short onboarding — stage, industry, what you're building. That context feeds every agent from here on.",
    },
    {
        step: 2,
        title: "QUERY ANY AGENT",
        description:
            "Market sizing, traction framing, valuation, investor targeting, due diligence prep — one conversation, routed automatically.",
    },
    {
        step: 3,
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
                            transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                            whileHover={{ y: -6, borderColor: "var(--accent)", transition: springHover }}
                            onMouseMove={handleCursorGlow}
                            className="cyber-card cyber-chamfer feature-card"
                            style={{ padding: 32, position: "relative" }}
                        >
                            <div className="cursor-glow" aria-hidden="true" />
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
                                    zIndex: 1,
                                }}
                            >
                                [{i + 1}/3]
                            </span>
                            <span
                                className="stat-number"
                                style={{ fontFamily: "var(--font-heading)", fontSize: 36, position: "relative", zIndex: 1 }}
                            >
                                <AnimatedCounter to={s.step} pad={2} />
                            </span>
                            <h3
                                style={{
                                    fontFamily: "var(--font-heading)",
                                    fontSize: 15.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    margin: "18px 0 10px",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                {s.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: 13.5,
                                    color: "var(--muted-foreground)",
                                    margin: 0,
                                    lineHeight: 1.75,
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                {s.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
