import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MenuIcon, CloseIcon, SparkleIcon } from "../icons";

const LINKS = [
    { href: "#features", label: "FEATURES" },
    { href: "#how-it-works", label: "PROTOCOL" },
    { href: "#coverage", label: "COVERAGE" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                display: "flex",
                justifyContent: "center",
                padding: scrolled ? "14px 16px" : "22px 16px",
                transition: "padding 250ms ease",
            }}
        >
            <nav
                className="cyber-card cyber-chamfer"
                style={{
                    width: "100%",
                    maxWidth: 1080,
                    padding: "10px 16px 10px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderColor: scrolled ? "var(--accent)" : "var(--border)",
                    boxShadow: scrolled ? "var(--shadow-neon-sm)" : "none",
                    transition: "border-color 300ms ease, box-shadow 300ms ease",
                }}
            >
                <a
                    href="#top"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontFamily: "var(--font-heading)",
                        fontWeight: 800,
                        fontSize: 15,
                        letterSpacing: "0.08em",
                    }}
                >
                    <span
                        className="cyber-chamfer-sm"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 32,
                            height: 32,
                            background: "var(--accent)",
                            boxShadow: "var(--shadow-neon-sm)",
                        }}
                    >
                        <SparkleIcon width={17} height={17} stroke="var(--background)" />
                    </span>
                    PITCHMATE
                </a>

                <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 30 }}>
                    {LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="cyber-label"
                            style={{ fontSize: 12, letterSpacing: "0.18em" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <a href="#cta" className="btn btn-primary btn-sm cyber-chamfer-sm nav-cta-desktop">
                        GET ACCESS
                    </a>
                    <button
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        className="nav-menu-btn cyber-chamfer-sm"
                        onClick={() => setMenuOpen((v) => !v)}
                        style={{
                            display: "none",
                            width: 42,
                            height: 42,
                            background: "var(--muted)",
                            border: "1px solid var(--border)",
                            color: "var(--foreground)",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {menuOpen ? <CloseIcon width={18} height={18} /> : <MenuIcon width={18} height={18} />}
                    </button>
                </div>
            </nav>

            {menuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="cyber-card cyber-chamfer nav-mobile-menu"
                    style={{
                        position: "absolute",
                        top: 78,
                        left: 16,
                        right: 16,
                        padding: 22,
                        display: "none",
                        flexDirection: "column",
                        gap: 18,
                        borderColor: "var(--accent)",
                        boxShadow: "var(--shadow-neon-sm)",
                    }}
                >
                    {LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className="cyber-label"
                            style={{ fontSize: 13 }}
                        >
                            {link.label}
                        </a>
                    ))}
                    <a
                        href="#cta"
                        className="btn btn-primary cyber-chamfer-sm"
                        onClick={() => setMenuOpen(false)}
                    >
                        GET ACCESS
                    </a>
                </motion.div>
            )}

            <style>{`
                @media (max-width: 760px) {
                    .nav-links-desktop, .nav-cta-desktop { display: none !important; }
                    .nav-menu-btn { display: inline-flex !important; }
                    .nav-mobile-menu { display: flex !important; }
                }
            `}</style>
        </motion.header>
    );
}
