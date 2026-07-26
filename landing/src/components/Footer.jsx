import { SparkleIcon } from "../icons";

export default function Footer() {
    return (
        <footer style={{ borderTop: "1px solid var(--border)", padding: "40px 0" }}>
            <div
                className="container"
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    alignItems: "center",
                    justifyContent: "space-between",
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
                        fontSize: 13,
                        letterSpacing: "0.08em",
                    }}
                >
                    <span
                        className="cyber-chamfer-sm"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            background: "var(--accent)",
                        }}
                    >
                        <SparkleIcon width={15} height={15} stroke="var(--background)" />
                    </span>
                    PITCHMATE
                </a>

                <div className="cyber-label" style={{ display: "flex", gap: 24, fontSize: 11 }}>
                    <a href="#features">FEATURES</a>
                    <a href="#how-it-works">PROTOCOL</a>
                    <a href="#coverage">COVERAGE</a>
                </div>

                <span style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--muted-foreground)" }}>
                    © {new Date().getFullYear()} PITCHMATE_SYS. ALL RIGHTS RESERVED.
                </span>
            </div>
        </footer>
    );
}
