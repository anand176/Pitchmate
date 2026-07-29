import { motion } from "framer-motion";
import { ArrowRightIcon } from "../icons";
import { EASE } from "../motion";
import RevealText from "./RevealText";
import Button from "./Button";

export default function CTASection() {
    return (
        <section id="cta" style={{ padding: "40px 0 120px" }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="cyber-card cyber-chamfer"
                    style={{
                        position: "relative",
                        overflow: "hidden",
                        padding: "76px 32px",
                        textAlign: "center",
                        borderColor: "var(--accent)",
                        boxShadow: "var(--shadow-neon)",
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: "-40%",
                            background:
                                "radial-gradient(circle, rgba(0,255,136,0.16) 0%, rgba(255,0,255,0.08) 45%, transparent 70%)",
                            filter: "blur(50px)",
                            zIndex: 0,
                        }}
                    />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <span className="cyber-label" style={{ justifyContent: "center" }}>
                            ACCESS_TERMINAL
                        </span>
                        <h2
                            aria-label="Ready to build your fundraise?"
                            style={{
                                fontSize: "clamp(1.7rem, 4vw, 2.5rem)",
                                fontWeight: 900,
                                textTransform: "uppercase",
                                margin: "18px auto 16px",
                                maxWidth: 580,
                                letterSpacing: "0.01em",
                                color: "var(--foreground)",
                            }}
                        >
                            <RevealText text="READY TO BUILD YOUR FUNDRAISE?" />
                        </h2>
                        <p
                            style={{
                                fontFamily: "var(--font-body)",
                                fontSize: 14,
                                color: "var(--muted-foreground)",
                                maxWidth: 460,
                                margin: "0 auto 32px",
                                lineHeight: 1.8,
                            }}
                        >
                            Start free, bring your startup idea, and let the agents do the heavy lifting.
                        </p>
                        <Button href="#top" variant="primary" icon={ArrowRightIcon}>
                            INITIATE ACCESS
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
