import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "../motion";

const charVariant = {
    hidden: { y: "115%", opacity: 0 },
    show: { y: "0%", opacity: 1, transition: { duration: 0.7, ease: EASE } },
};

/* Splits text into per-character spans that write themselves in left-to-right,
   then a single white sheen sweeps across once. Not a loop, not a glow.
   One whileInView trigger on the container drives every child via
   staggerChildren — independent per-character observers are unreliable. */
export default function RevealText({ text, as: Tag = "span", delay = 0, charStagger = 0.026, style, className }) {
    const reduceMotion = useReducedMotion();
    const words = text.split(" ");
    const totalChars = text.replace(/\s/g, "").length;

    if (reduceMotion) {
        return (
            <Tag className={className} style={style}>
                {text}
            </Tag>
        );
    }

    const containerVariant = {
        hidden: {},
        show: { transition: { staggerChildren: charStagger, delayChildren: delay } },
    };

    const sheenVariant = {
        hidden: { x: "-130%" },
        show: {
            x: "230%",
            transition: { duration: 0.9, ease: EASE, delay: delay + totalChars * charStagger + 0.12 },
        },
    };

    return (
        <motion.span
            aria-label={text}
            className={className}
            style={{ position: "relative", display: "inline-block", ...style }}
            variants={containerVariant}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
        >
            {words.map((word, wi) => (
                <Fragment key={wi}>
                    <span aria-hidden="true" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                        {word.split("").map((char, ci) => (
                            <span key={ci} style={{ display: "inline-block", overflow: "hidden" }}>
                                <motion.span style={{ display: "inline-block" }} variants={charVariant}>
                                    {char}
                                </motion.span>
                            </span>
                        ))}
                    </span>
                    {wi < words.length - 1 ? " " : ""}
                </Fragment>
            ))}
            <motion.span
                aria-hidden="true"
                variants={sheenVariant}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "35%",
                    height: "100%",
                    background:
                        "linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.85) 50%, transparent 100%)",
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                }}
            />
        </motion.span>
    );
}
