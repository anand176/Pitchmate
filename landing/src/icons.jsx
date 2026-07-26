/* Minimal inline SVG icon set — no emoji, no external icon package. */

const base = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

export function TargetIcon(props) {
    return (
        <svg {...base} {...props}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" />
        </svg>
    );
}

export function FileIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 13h6M9 17h6" />
        </svg>
    );
}

export function UsersIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

export function ShieldIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

export function MicIcon(props) {
    return (
        <svg {...base} {...props}>
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <path d="M12 19v3M8 22h8" />
        </svg>
    );
}

export function DatabaseIcon(props) {
    return (
        <svg {...base} {...props}>
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
            <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
        </svg>
    );
}

export function ArrowRightIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

export function ChartIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M3 3v18h18" />
            <path d="M7 16l4-6 3 4 5-8" />
        </svg>
    );
}

export function SparkleIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
            <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
        </svg>
    );
}

export function CheckIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

export function MenuIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

export function CloseIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}
