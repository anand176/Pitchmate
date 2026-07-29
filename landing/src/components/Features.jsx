import { motion } from "framer-motion";
import { TargetIcon, FileIcon, UsersIcon, ShieldIcon, MicIcon, DatabaseIcon } from "../icons";
import { EASE, springHover } from "../motion";
import { handleCursorGlow } from "../cursorGlow";

const FEATURES = [
    {
        icon: TargetIcon,
        title: "MARKET & GTM STRATEGY",
        description:
            "Validates your TAM/SAM/SOM and competitive landscape, then shapes a go-to-market plan — channels, ICP, and pricing.",
    },
    {
        icon: FileIcon,
        title: "DECK & DOCUMENT CREATOR",
        description:
            "Turns your problem, solution, traction, and business model into an investor-grade pitch deck — exported as a styled PDF or DOCX.",
    },
    {
        icon: UsersIcon,
        title: "INVESTOR OUTREACH & PIPELINE",
        description:
            "Matches you to the right investors for your stage, drafts personalized outreach, and tracks every conversation from research to term sheet.",
    },
    {
        icon: ShieldIcon,
        title: "DUE DILIGENCE PREP",
        description:
            "Anticipates the tough questions and red flags investors will raise, with a downloadable Q&A brief so you walk in prepared.",
    },
    {
        icon: MicIcon,
        title: "CALL PRACTICE SIMULATOR",
        description:
            "Rehearse investor and sales calls against an AI persona — every answer scored with a coaching note before the real thing.",
    },
    {
        icon: DatabaseIcon,
        title: "KNOWLEDGE BASE",
        description:
            "Upload decks, memos, and research — ask questions or get a slide-by-slide deck review, grounded in your own material.",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay: (i % 3) * 0.1 + Math.floor(i / 3) * 0.06, ease: EASE },
    }),
};

export default function Features() {
    return (
        <section id="features" style={{ padding: "96px 0" }}>
            <div className="container">
                <SectionHeading
                    eyebrow="MODULE_INDEX"
                    title="ONE CO-PILOT FOR THE WHOLE FUNDRAISE"
                    description="Nine specialist AI agents, each locked to a single part of the journey — coordinated so context carries through automatically."
                />

                <div
                    style={{
                        marginTop: 56,
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 20,
                    }}
                >
                    {FEATURES.map(({ icon: Icon, title, description }, i) => {
                        const accentVar = i % 3 === 0 ? "--accent" : i % 3 === 1 ? "--accent-secondary" : "--accent-tertiary";
                        return (
                            <motion.div
                                key={title}
                                className="cyber-card cyber-chamfer feature-card"
                                variants={cardVariants}
                                custom={i}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: "-60px" }}
                                whileHover={{ y: -6, borderColor: `var(${accentVar})`, transition: springHover }}
                                onMouseMove={handleCursorGlow}
                            >
                                <div className="cursor-glow" aria-hidden="true" />
                                <div className="cyber-terminal-header" style={{ position: "relative", zIndex: 1 }}>
                                    <span className="cyber-terminal-dot" style={{ background: "var(--destructive)" }} />
                                    <span className="cyber-terminal-dot" style={{ background: "#ffb800" }} />
                                    <span className="cyber-terminal-dot" style={{ background: "var(--accent)" }} />
                                </div>
                                <div style={{ padding: 26, position: "relative", zIndex: 1 }}>
                                    <span
                                        className="cyber-chamfer-sm"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 44,
                                            height: 44,
                                            background: `rgba(0,0,0,0.3)`,
                                            border: `1px solid var(${accentVar})`,
                                            boxShadow: `0 0 12px color-mix(in srgb, var(${accentVar}) 40%, transparent)`,
                                        }}
                                    >
                                        <Icon width={20} height={20} stroke={`var(${accentVar})`} />
                                    </span>
                                    <h3
                                        style={{
                                            fontFamily: "var(--font-heading)",
                                            fontSize: 15.5,
                                            fontWeight: 700,
                                            letterSpacing: "0.04em",
                                            margin: "20px 0 10px",
                                        }}
                                    >
                                        {title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: 13.5,
                                            color: "var(--muted-foreground)",
                                            margin: 0,
                                            lineHeight: 1.75,
                                        }}
                                    >
                                        {description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function SectionHeading({ eyebrow, title, description, align = "center" }) {
    return (
        <div
            style={{
                textAlign: align,
                maxWidth: 660,
                margin: align === "center" ? "0 auto" : 0,
            }}
        >
            <span className="cyber-label">{eyebrow}</span>
            <h2
                style={{
                    fontSize: "clamp(1.6rem, 3.2vw, 2.3rem)",
                    fontWeight: 800,
                    margin: "16px 0 14px",
                    letterSpacing: "0.01em",
                }}
            >
                {title}
            </h2>
            {description && (
                <p
                    style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14.5,
                        color: "var(--muted-foreground)",
                        lineHeight: 1.75,
                    }}
                >
                    {description}
                </p>
            )}
        </div>
    );
}
