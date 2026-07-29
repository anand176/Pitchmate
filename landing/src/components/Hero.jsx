import { useEffect, useRef } from "react";
import {
    motion,
    animate,
    useMotionValue,
    useSpring,
    useTransform,
    useScroll,
    useReducedMotion,
} from "framer-motion";
import { ArrowRightIcon, SparkleIcon, TargetIcon, FileIcon, ChartIcon } from "../icons";
import { EASE, fadeUpSm } from "../motion";
import RevealText from "./RevealText";
import AnimatedCounter from "./AnimatedCounter";
import Button from "./Button";

export default function Hero() {
    return (
        <section
            id="top"
            style={{
                position: "relative",
                paddingTop: 168,
                paddingBottom: 96,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <GhostWord />
            <div className="container">
                <motion.div variants={fadeUpSm} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}>
                    <span
                        className="cyber-card cyber-chamfer-sm cyber-label"
                        style={{ padding: "9px 18px", borderColor: "rgba(0,255,136,0.3)" }}
                    >
                        <SparkleIcon width={13} height={13} stroke="var(--accent)" />
                        AI FUNDRAISE PROTOCOL — V2.4
                    </span>
                </motion.div>

                <h1
                    aria-label="Your entire fundraise, run by one AI team."
                    style={{
                        fontSize: "clamp(2.1rem, 5.5vw, 4.2rem)",
                        fontWeight: 900,
                        lineHeight: 1.08,
                        margin: "28px auto 0",
                        maxWidth: 880,
                        letterSpacing: "0.01em",
                        textTransform: "uppercase",
                        color: "var(--foreground)",
                    }}
                >
                    <RevealText text="Your entire fundraise," delay={0.15} />
                    <br />
                    <RevealText text="RUN BY ONE AI TEAM." delay={0.55} />
                </h1>

                <motion.p
                    variants={fadeUpSm}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
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
                    variants={fadeUpSm}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    custom={3}
                    style={{
                        display: "flex",
                        gap: 16,
                        justifyContent: "center",
                        marginTop: 40,
                        flexWrap: "wrap",
                    }}
                >
                    <Button href="#cta" variant="primary" icon={ArrowRightIcon}>
                        INITIATE ACCESS
                    </Button>
                    <Button href="#how-it-works" variant="ghost">
                        VIEW PROTOCOL
                    </Button>
                </motion.div>

                <div style={{ marginTop: 88, position: "relative" }}>
                    <DashboardHUD />
                </div>
            </div>
        </section>
    );
}

/* Abstract, illustrative HUD representation of the product — not a real
   screenshot. Built entirely from holographic glass panels + neon accents.
   Tilts toward the pointer in 3D and drifts with scroll parallax. */
function DashboardHUD() {
    const reduceMotion = useReducedMotion();
    const sectionRef = useRef(null);

    const baseOpacity = useMotionValue(reduceMotion ? 1 : 0);
    const baseY = useMotionValue(reduceMotion ? 0 : 30);
    const baseRotateX = useMotionValue(reduceMotion ? 0 : 12);

    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);
    const springX = useSpring(pointerX, { stiffness: 150, damping: 20 });
    const springY = useSpring(pointerY, { stiffness: 150, damping: 20 });
    const tiltRotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
    const tiltRotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);
    const rotateX = useTransform([baseRotateX, tiltRotateX], ([b, t]) => b + t);

    const glowBackground = useTransform([springX, springY], ([gx, gy]) =>
        `radial-gradient(circle at ${(gx + 0.5) * 100}% ${(gy + 0.5) * 100}%, rgba(255,255,255,0.14), transparent 55%)`
    );

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
    const scrollY = useTransform(scrollYProgress, [0, 1], [30, -30]);
    const scrollScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 0.97]);
    const scrollOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.7, 1, 1, 0.7]);

    useEffect(() => {
        if (reduceMotion) return;
        animate(baseOpacity, 1, { duration: 1.1, ease: EASE, delay: 0.3 });
        animate(baseY, 0, { duration: 1.1, ease: EASE, delay: 0.3 });
        animate(baseRotateX, 0, { duration: 1.1, ease: EASE, delay: 0.3 });
    }, [reduceMotion]);

    function handlePointerMove(e) {
        if (reduceMotion) return;
        const rect = e.currentTarget.getBoundingClientRect();
        pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
        pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
    }
    function handlePointerLeave() {
        pointerX.set(0);
        pointerY.set(0);
    }

    return (
        <div ref={sectionRef} style={{ position: "relative", maxWidth: 920, margin: "0 auto", textAlign: "left" }}>
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
            <motion.div style={reduceMotion ? undefined : { y: scrollY, scale: scrollScale, opacity: scrollOpacity }}>
                <div style={{ perspective: 1200 }}>
                    <motion.div
                        onPointerMove={handlePointerMove}
                        onPointerLeave={handlePointerLeave}
                        className="cyber-card cyber-chamfer"
                        style={{
                            position: "relative",
                            padding: 22,
                            display: "grid",
                            gridTemplateColumns: "1fr 1.6fr",
                            gap: 16,
                            borderColor: "rgba(0,255,136,0.25)",
                            boxShadow: "var(--shadow-neon-sm)",
                            opacity: baseOpacity,
                            y: baseY,
                            rotateX,
                            rotateY: tiltRotateY,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {!reduceMotion && (
                            <motion.div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: glowBackground,
                                    pointerEvents: "none",
                                    zIndex: 3,
                                }}
                            />
                        )}

                        {/* left rail: readiness score */}
                        <div
                            className="cyber-card cyber-chamfer-sm"
                            style={{
                                padding: 20,
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                transform: "translateZ(20px)",
                            }}
                        >
                            <div className="cyber-label" style={{ fontSize: 11 }}>
                                READINESS_SCORE
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                <span
                                    className="stat-number"
                                    style={{ fontFamily: "var(--font-heading)", fontSize: 40 }}
                                >
                                    <AnimatedCounter to={78} />
                                </span>
                                <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>/ 100</span>
                            </div>
                            <ReadinessBar />
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
                            <div
                                className="cyber-card cyber-chamfer-sm"
                                style={{ transform: "translateZ(35px)" }}
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
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: 12,
                                    transform: "translateZ(50px)",
                                }}
                            >
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
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

function ReadinessBar() {
    return (
        <div
            style={{
                height: 6,
                background: "var(--muted)",
                border: "1px solid var(--border)",
                overflow: "hidden",
            }}
        >
            <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 0.78 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.15 }}
                style={{
                    width: "100%",
                    transformOrigin: "left",
                    height: "100%",
                    background: "var(--accent)",
                    boxShadow: "0 0 8px var(--accent)",
                }}
            />
        </div>
    );
}

/* Oversized faint wordmark bleeding off the edges behind the HUD — pure
   background texture, never competes with foreground text for attention. */
function GhostWord() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 0.05 } : { y: 200, opacity: 0 }}
            animate={reduceMotion ? { opacity: 0.05 } : { y: 0, opacity: 0.05 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.9 }}
            style={{
                position: "absolute",
                zIndex: -1,
                bottom: -30,
                left: 0,
                right: 0,
                textAlign: "center",
                pointerEvents: "none",
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--foreground)",
                fontSize: "clamp(120px, 20vw, 380px)",
                lineHeight: 0.8,
                whiteSpace: "nowrap",
            }}
        >
            PITCHMATE
        </motion.div>
    );
}
