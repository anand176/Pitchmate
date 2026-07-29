import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { EASE } from "../motion";

/* Counts up from 0 to `to` once it scrolls into view. Writes to the DOM
   node directly (no re-render per frame) to keep it off the React tree. */
export default function AnimatedCounter({ to, prefix = "", suffix = "", pad = 0, duration = 1.4 }) {
    const nodeRef = useRef(null);
    const reduceMotion = useReducedMotion();
    const isInView = useInView(nodeRef, { once: true, margin: "-80px" });

    const format = (n) => `${prefix}${String(Math.round(n)).padStart(pad, "0")}${suffix}`;

    useEffect(() => {
        if (!isInView) return;
        const node = nodeRef.current;
        if (!node) return;

        if (reduceMotion) {
            node.textContent = format(to);
            return;
        }

        const controls = animate(0, to, {
            duration,
            ease: EASE,
            onUpdate(value) {
                node.textContent = format(value);
            },
        });
        return () => controls.stop();
    }, [isInView]);

    return <span ref={nodeRef}>{format(0)}</span>;
}
