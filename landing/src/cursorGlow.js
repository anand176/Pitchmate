/* Mutates the .cursor-glow child's background directly on pointer move —
   avoids a React re-render per mouse move so hover stays smooth. */
export function handleCursorGlow(e) {
    const el = e.currentTarget.querySelector(".cursor-glow");
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(0,255,136,0.16), transparent 60%)`;
}
