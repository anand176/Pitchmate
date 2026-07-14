/**
 * Minimal hand-authored stroke icon set (no external icon library dependency).
 * 24x24 viewBox, currentColor stroke, Lucide-ish proportions.
 */
const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

function Icon({ size = 18, children, ...rest }) {
    return (
        <svg width={size} height={size} {...base} {...rest}>
            {children}
        </svg>
    );
}

export const HomeIcon = (props) => (
    <Icon {...props}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </Icon>
);

export const TrendingUpIcon = (props) => (
    <Icon {...props}>
        <polyline points="3 16 9.5 9.5 14 14 21 6" />
        <polyline points="14.5 6 21 6 21 12.5" />
    </Icon>
);

export const UsersIcon = (props) => (
    <Icon {...props}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.2a3.2 3.2 0 0 1 0 6" />
        <path d="M15 14.2a5.5 5.5 0 0 1 5.5 5.8" />
    </Icon>
);

export const TargetIcon = (props) => (
    <Icon {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.7" />
        <circle cx="12" cy="12" r="0.9" fill="currentColor" />
    </Icon>
);

export const HandshakeIcon = (props) => (
    <Icon {...props}>
        <circle cx="7.5" cy="7.5" r="3" />
        <circle cx="16.5" cy="7.5" r="3" />
        <path d="M2.5 20c.6-3.2 2.8-5 5-5s3.6 1.2 4.5 2.6c.9-1.4 2.3-2.6 4.5-2.6s4.4 1.8 5 5" />
    </Icon>
);

export const CoinsIcon = (props) => (
    <Icon {...props}>
        <ellipse cx="9" cy="7" rx="6" ry="3.2" />
        <path d="M3 7v4.5c0 1.77 2.69 3.2 6 3.2s6-1.43 6-3.2V7" />
        <path d="M3 11.5V16c0 1.77 2.69 3.2 6 3.2 1 0 1.94-.13 2.77-.36" />
        <path d="M13.5 10.6c3 .2 5.5 1.6 5.5 3.4 0 1.77-2.69 3.2-6 3.2-.6 0-1.18-.05-1.73-.14" />
    </Icon>
);

export const FileTextIcon = (props) => (
    <Icon {...props}>
        <path d="M6 2.75h8l4.5 4.5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z" />
        <path d="M14 2.75V7h4.5" />
        <path d="M8.5 12.5h7M8.5 16h7M8.5 9h3" />
    </Icon>
);

export const SettingsIcon = (props) => (
    <Icon {...props}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.5v3M12 18.5v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2.5 12h3M18.5 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
    </Icon>
);

export const MessageCircleIcon = (props) => (
    <Icon {...props}>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Icon>
);

export const SendIcon = (props) => (
    <Icon strokeWidth={2.2} {...props}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Icon>
);

export const CloseIcon = (props) => (
    <Icon strokeWidth={2} {...props}>
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
    </Icon>
);

export const SparklesIcon = (props) => (
    <Icon {...props}>
        <path d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10 10.4 8.4 12 3.5Z" />
        <path d="M19 15.5 19.8 17.7 22 18.5 19.8 19.3 19 21.5 18.2 19.3 16 18.5 18.2 17.7 19 15.5Z" />
    </Icon>
);

export const CheckCircleIcon = (props) => (
    <Icon {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <polyline points="8.5 12.3 11 14.8 15.5 9.6" />
    </Icon>
);

export const AlertCircleIcon = (props) => (
    <Icon {...props}>
        <circle cx="12" cy="12" r="8.5" />
        <line x1="12" y1="7.5" x2="12" y2="13" />
        <circle cx="12" cy="16.3" r="0.9" fill="currentColor" />
    </Icon>
);

export const LogOutIcon = (props) => (
    <Icon {...props}>
        <path d="M9 4.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H9" />
        <line x1="21" y1="12" x2="10.5" y2="12" />
        <polyline points="16.5 7.5 21 12 16.5 16.5" />
    </Icon>
);

export const UploadIcon = (props) => (
    <Icon {...props}>
        <path d="M4 15.5v3a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-3" />
        <polyline points="7.5 8.5 12 4 16.5 8.5" />
        <line x1="12" y1="4" x2="12" y2="15" />
    </Icon>
);

export const InboxIcon = (props) => (
    <Icon {...props}>
        <path d="M3.5 12.5h5l1.5 2.7h4l1.5-2.7h5" />
        <path d="M5.3 5.6h13.4a1 1 0 0 1 .97.76l1.8 6.14v6a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-6l1.83-6.14a1 1 0 0 1 .97-.76Z" />
    </Icon>
);

export const PlusIcon = (props) => (
    <Icon strokeWidth={2.2} {...props}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
);
