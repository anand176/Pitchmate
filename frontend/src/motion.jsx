/**
 * Shared Framer Motion primitives for Pitchmate. Centralizes durations/easing
 * so the motion layer stays consistent, and wraps `useReducedMotion` so every
 * consumer automatically goes static (no transforms/springs) when the OS
 * setting is on, instead of merely shortening durations.
 */
import { useEffect, useState } from "react";
import {
    motion,
    useReducedMotion as useFramerReducedMotion,
    useMotionValue,
    useSpring,
} from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export const SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 };
export const SPRING_SOFT = { type: "spring", stiffness: 260, damping: 28, mass: 1 };

/** Re-exported so pages don't each import from "framer-motion" directly. */
export const useReducedMotion = useFramerReducedMotion;

/** Route-level page transition: opacity 0->1, y 8->0, ~220ms. */
export const pageVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE } },
};

/** Result card container: fade+rise in, staggers direct animated children. */
export const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.24, ease: EASE, staggerChildren: 0.04, delayChildren: 0.04 },
    },
};

/** A single result section (title, list, paragraph, table, tag row...). */
export const sectionVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
};

/**
 * Wraps a result card so it fade+rises in only when `animate` is true (a
 * fresh analysis just arrived), and renders statically when restoring a
 * saved result on mount. Pass a `key` that changes on every fresh run so the
 * enter transition replays for repeat submissions.
 */
export function ResultCard({ animate, className = "dash-card", children, ...rest }) {
    const reduce = useReducedMotion();
    if (reduce) {
        return <div className={className} {...rest}>{children}</div>;
    }
    return (
        <motion.div
            className={className}
            variants={cardVariants}
            initial={animate ? "hidden" : false}
            animate="visible"
            {...rest}
        >
            {children}
        </motion.div>
    );
}

/** A staggered child inside a ResultCard — title, list, paragraph, table, etc. */
export function Section({ as = "div", children, ...rest }) {
    const reduce = useReducedMotion();
    const MotionTag = motion[as] || motion.div;
    if (reduce) {
        const Plain = as;
        return <Plain {...rest}>{children}</Plain>;
    }
    return (
        <MotionTag variants={sectionVariants} {...rest}>
            {children}
        </MotionTag>
    );
}

/**
 * Small, consistent hover/tap lift for primary buttons (y:-1 on hover,
 * scale:0.98 on tap). Skipped entirely — not just shortened — when disabled
 * or under reduced motion.
 */
export function MotionButton({ className = "dash-btn-primary", disabled, children, ...rest }) {
    const reduce = useReducedMotion();
    const skip = reduce || disabled;
    return (
        <motion.button
            className={className}
            disabled={disabled}
            whileHover={skip ? undefined : { y: -1 }}
            whileTap={skip ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE }}
            {...rest}
        >
            {children}
        </motion.button>
    );
}

/**
 * "Clear" / "Store" pair shown on every dashboard result card. Clear deletes
 * the saved analysis for that module (asks for confirmation first, since it's
 * destructive); Store pushes the result into the Knowledge Base. Both
 * `onClear`/`onStore` are async functions supplied by the page — this
 * component only owns the button loading/error UI, not the actual logic.
 */
export function ResultActions({ onClear, onStore, className = "dash-result-actions" }) {
    const [clearing, setClearing] = useState(false);
    const [storing, setStoring] = useState(false);
    const [error, setError] = useState("");
    const [stored, setStored] = useState(false);

    const handleClear = async () => {
        if (clearing) return;
        if (!window.confirm("Clear this result? This also deletes the saved analysis for this module.")) return;
        setClearing(true); setError("");
        try {
            await onClear();
        } catch (e) {
            setError(e.message || "Clear failed.");
        } finally {
            setClearing(false);
        }
    };

    const handleStore = async () => {
        if (storing) return;
        setStoring(true); setError(""); setStored(false);
        try {
            await onStore();
            setStored(true);
            setTimeout(() => setStored(false), 2500);
        } catch (e) {
            setError(e.message || "Store failed.");
        } finally {
            setStoring(false);
        }
    };

    return (
        <div className={className} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="dash-btn-ghost dash-btn-sm" onClick={handleStore} disabled={storing}>
                {storing ? "Storing..." : stored ? "Stored ✓" : "Store in Knowledge Base"}
            </button>
            <button type="button" className="dash-btn-ghost dash-btn-sm" onClick={handleClear} disabled={clearing}>
                {clearing ? "Clearing..." : "Clear"}
            </button>
            {error && <span className="dash-error" style={{ margin: 0 }}>{error}</span>}
        </div>
    );
}

/** Springs a displayed integer toward `target`, counting up/down as it goes. */
export function useCountUp(target, { reduce } = {}) {
    const [display, setDisplay] = useState(target);
    const motionValue = useMotionValue(target);
    const spring = useSpring(motionValue, SPRING_SOFT);

    useEffect(() => {
        if (reduce) {
            motionValue.jump(target);
            setDisplay(target);
            return;
        }
        motionValue.set(target);
    }, [target, reduce, motionValue]);

    useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

    return display;
}

export { motion, AnimatePresence } from "framer-motion";
