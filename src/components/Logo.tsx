import React from "react";

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8" }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background Bubble */}
            <path
                d="M10 10C10 4.47715 14.4772 0 20 0H80C85.5228 0 90 4.47715 90 10V70C90 75.5228 85.5228 80 80 80H35L15 95V80H10C4.47715 80 0 75.5228 0 70V10C0 4.47715 4.47715 0 10 0Z"
                fill="url(#logo_gradient)"
            />

            {/* Concentric Circles & Center Dot */}
            <circle cx="50" cy="40" r="5" fill="white" />
            <circle cx="50" cy="40" r="12" stroke="white" strokeWidth="4" />
            <circle cx="50" cy="40" r="22" stroke="white" strokeWidth="4" />
            <circle cx="50" cy="40" r="32" stroke="white" strokeWidth="4" />

            <defs>
                <linearGradient
                    id="logo_gradient"
                    x1="0"
                    y1="0"
                    x2="100"
                    y2="100"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#4FD1C5" />
                    <stop offset="1" stopColor="#3182CE" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default Logo;
