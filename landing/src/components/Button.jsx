import { motion } from "framer-motion";
import { springHover } from "../motion";

/* Primary buttons with an icon get the magnetic treatment: a mint fill
   already sits under the text and sweeps out to swallow the icon badge
   on hover, which steps back to meet it (see .btn-magnetic* in index.css).
   Everything else keeps the simple spring-hover pill. */
export default function Button({ href, variant = "primary", size, icon: Icon, children, onClick, className = "" }) {
    const isMagnetic = variant === "primary" && Icon;

    if (isMagnetic) {
        const classes = ["btn-magnetic", size === "sm" ? "btn-magnetic-sm" : "", className]
            .filter(Boolean)
            .join(" ");
        const iconSize = size === "sm" ? 14 : 16;
        return (
            <a href={href} onClick={onClick} className={classes}>
                <span className="btn-magnetic-fill" aria-hidden="true" />
                <span className="btn-magnetic-text">{children}</span>
                <span className="btn-magnetic-circle">
                    <Icon width={iconSize} height={iconSize} stroke="var(--accent)" />
                </span>
            </a>
        );
    }

    const classes = ["btn", `btn-${variant}`, size ? `btn-${size}` : "", "cyber-chamfer-sm", className]
        .filter(Boolean)
        .join(" ");

    return (
        <motion.a
            href={href}
            onClick={onClick}
            className={classes}
            initial="rest"
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            variants={{ rest: { scale: 1 }, hover: { scale: 1.03 } }}
            transition={springHover}
        >
            {children}
            {Icon && (
                <motion.span
                    style={{ display: "inline-flex" }}
                    variants={{ rest: { x: 0 }, hover: { x: 4 } }}
                    transition={springHover}
                >
                    <Icon width={16} height={16} />
                </motion.span>
            )}
        </motion.a>
    );
}
