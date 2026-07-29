export const EASE = [0.16, 1, 0.3, 1];

export const DURATION = {
    fast: 0.4,
    base: 0.7,
    slow: 1.1,
};

export const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: DURATION.base, delay: i * 0.09, ease: EASE },
    }),
};

export const fadeUpSm = {
    hidden: { opacity: 0, y: 14 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: DURATION.fast, delay: i * 0.06, ease: EASE },
    }),
};

export const springHover = { type: "spring", stiffness: 340, damping: 24 };
export const springTilt = { stiffness: 150, damping: 20 };
