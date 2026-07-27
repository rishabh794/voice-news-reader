interface VoxLogoProps {
    className?: string;
}

/**
 * VoxNews logo mark — a stylized sound wave emanating from a speech bubble.
 * Professional, geometric, works at any size.
 */
const VoxLogo = ({ className = '' }: VoxLogoProps) => (
    <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="VoxNews logo"
    >
        {/* Rounded square background */}
        <rect x="2" y="2" width="52" height="52" rx="14" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" />

        {/* Speech bubble base */}
        <path
            d="M14 18C14 15.7909 15.7909 14 18 14H38C40.2091 14 42 15.7909 42 18V32C42 34.2091 40.2091 36 38 36H24L18 42V36H18C15.7909 36 14 34.2091 14 32V18Z"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />

        {/* Sound wave bars inside bubble — representing voice */}
        <rect x="21" y="22" width="2.5" height="10" rx="1.25" fill="currentColor" fillOpacity="0.6" />
        <rect x="26.75" y="19" width="2.5" height="16" rx="1.25" fill="currentColor" fillOpacity="0.85" />
        <rect x="32.5" y="21" width="2.5" height="12" rx="1.25" fill="currentColor" fillOpacity="0.6" />
    </svg>
);

export default VoxLogo;
