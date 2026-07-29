/* One-shot boot flash on load — five chamfer-free panels per row slide
   apart to reveal the page. Pure CSS animation (see .splash* in index.css)
   so it can't fight with framer-motion timing, and prefers-reduced-motion
   collapses it to an instant reveal. */
export default function Splash() {
    return (
        <div className="splash" aria-hidden="true">
            <div className="splash-row splash-row-top">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="splash-box" style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
            </div>
            <div className="splash-row splash-row-bottom">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="splash-box" style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
            </div>
        </div>
    );
}
