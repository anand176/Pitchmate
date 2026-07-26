import { motion } from "framer-motion";
import { ArrowRightIcon, SparkleIcon, TargetIcon, FileIcon, ChartIcon } from "../icons";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
    }),
};

export default function Hero() {
    return (
        <section
            id="top"
            style={{
                paddingTop: 168,
                paddingBottom: 96,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <div className="container">
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
                    <span
                        className="cyber-card cyber-chamfer-sm cyber-label"
                        style={{ padding: "9px 18px", borderColor: "rgba(0,255,136,0.3)" }}
                    >
                        <SparkleIcon width={13} height={13} stroke="var(--accent)" />
                        AI FUNDRAISE PROTOCOL — V2.4
                    </span>
                </motion.div>

                <motion.h1
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={1}
                    style={{
                        fontSize: "clamp(2.1rem, 5.5vw, 4.2rem)",
                        fontWeight: 900,
                        lineHeight: 1.08,
                        margin: "28px auto 0",
                        maxWidth: 880,
                        letterSpacing: "0.01em",
                        textTransform: "uppercase",
                    }}
                >
                    Your entire fundraise,
                    <br />
                    <span className="cyber-glitch neon-text" data-text="RUN BY ONE AI TEAM.">
                        RUN BY ONE AI TEAM.
                    </span>
                </motion.h1>

                <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={2}
                    className="blink-cursor"
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(0.9rem, 1.4vw, 1.02rem)",
                        color: "var(--muted-foreground)",
                        maxWidth: 640,
                        margin: "24px auto 0",
                        lineHeight: 1.8,
                    }}
                >
                    <span style={{ color: "var(--accent)" }}>{"> "}</span>
                    Validate your market, build an investor-grade deck, target the right investors, and
                    rehearse the hard questions — all in one place, powered by specialist AI agents that
                    actually understand your startup.
                </motion.p>

                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={3}
                    style={{
                        display: "flex",
                        gap: 16,
                        justifyContent: "center",
                        marginTop: 40,
                        flexWrap: "wrap",
                    }}
                >
                    <a href="#cta" className="btn btn-primary cyber-chamfer-sm">
                        INITIATE ACCESS
                        <ArrowRightIcon width={16} height={16} />
                    </a>
                    <a href="#how-it-works" className="btn btn-ghost cyber-chamfer-sm">
                        VIEW PROTOCOL
                    </a>
                </motion.div>

                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={4}
                    style={{ marginTop: 88, position: "relative" }}
                >
                    <DashboardHUD />
                </motion.div>
            </div>
        </section>
    );
}

/* Abstract, illustrative HUD representation of the product — not a real
   screenshot. Built entirely from holographic glass panels + neon accents. */
function DashboardHUD() {
    return (
        <div style={{ position: "relative", maxWidth: 920, margin: "0 auto", textAlign: "left" }}>
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "-8%",
                    background: "radial-gradient(circle, rgba(0,255,136,0.16) 0%, rgba(0,255,136,0) 70%)",
                    filter: "blur(30px)",
                    zIndex: -1,
                }}
            />
            <div
                className="cyber-card cyber-chamfer"
                style={{
                    padding: 22,
                    display: "grid",
                    gridTemplateColumns: "1fr 1.6fr",
                    gap: 16,
                    borderColor: "rgba(0,255,136,0.25)",
                    boxShadow: "var(--shadow-neon-sm)",
                }}
            >
                {/* left rail: readiness score */}
                <div
                    className="cyber-card cyber-chamfer-sm"
                    style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}
                >
                    <div className="cyber-label" style={{ fontSize: 11 }}>
                        READINESS_SCORE
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span
                            style={{ fontFamily: "var(--font-heading)", fontSize: 40, fontWeight: 800 }}
                            className="neon-text"
                        >
                            78
                        </span>
                        <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>/ 100</span>
                    </div>
                    <div
                        style={{
                            height: 6,
                            background: "var(--muted)",
                            border: "1px solid var(--border)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: "78%",
                                height: "100%",
                                background: "var(--accent)",
                                boxShadow: "0 0 8px var(--accent)",
                            }}
                        />
                    </div>
                    {["MARKET_SIZING", "TRACTION", "DECK"].map((label, i) => (
                        <div
                            key={label}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                        >
                            <span
                                style={{
                                    fontSize: 11.5,
                                    color: "var(--muted-foreground)",
                                    letterSpacing: "0.08em",
                                }}
                            >
                                {label}
                            </span>
                            <span
                                style={{
                                    width: 16,
                                    height: 16,
                                    background: i === 2 ? "var(--muted)" : "rgba(0,255,136,0.18)",
                                    border: `1px solid ${i === 2 ? "var(--border)" : "var(--accent)"}`,
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* right: terminal query + agent cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="cyber-card cyber-chamfer-sm">
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
                                query.sh
                            </span>
                        </div>
                        <div style={{ padding: "14px 16px", fontSize: 12.5, lineHeight: 1.7 }}>
                            <span style={{ color: "var(--accent)" }}>{"> "}</span>
                            <span style={{ color: "var(--muted-foreground)" }}>
                                what's my TAM/SAM/SOM and how should I position against competitors?
                            </span>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {[
                            { icon: TargetIcon, label: "MARKET" },
                            { icon: FileIcon, label: "DECK" },
                            { icon: ChartIcon, label: "VALUATION" },
                        ].map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="cyber-card cyber-card--hover cyber-chamfer-sm"
                                style={{
                                    padding: "16px 10px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    textAlign: "center",
                                }}
                            >
                                <Icon width={17} height={17} stroke="var(--accent)" />
                                <span
                                    style={{
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        letterSpacing: "0.1em",
                                        color: "var(--muted-foreground)",
                                    }}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
