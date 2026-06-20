import { useState } from 'react';

/**
 * Reusable star rating component.
 *
 * Props:
 *  - value     : number 0-5 (controlled value)
 *  - onChange  : (number) => void (optional, makes it interactive)
 *  - size      : number px (default 18)
 *  - readOnly  : boolean (default false)
 *  - showValue : boolean (default false) — renders numeric value next to stars
 *  - label     : string (optional) — text shown to the right
 *  - color     : string (default '#fbbf24')
 *  - className : string
 */
export default function StarRating({
    value = 0,
    onChange,
    size = 18,
    readOnly = false,
    showValue = false,
    label,
    color = '#fbbf24',
    className = '',
}) {
    const [hover, setHover] = useState(0);
    const interactive = !readOnly && typeof onChange === 'function';

    const display = hover || value || 0;

    const handleClick = (idx) => {
        if (interactive) onChange(idx);
    };

    const handleKeyDown = (e) => {
        if (!interactive) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(5, (value || 0) + 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(1, (value || 0) - 1));
        }
    };

    return (
        <span
            className={`star-rating ${className}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
            <span
                role={interactive ? 'slider' : undefined}
                aria-label={label || 'rating'}
                aria-valuemin={interactive ? 1 : undefined}
                aria-valuemax={interactive ? 5 : undefined}
                aria-valuenow={interactive ? value : undefined}
                tabIndex={interactive ? 0 : -1}
                onKeyDown={handleKeyDown}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: interactive ? 'pointer' : 'default',
                    outline: 'none',
                }}
            >
                {[1, 2, 3, 4, 5].map((idx) => {
                    const fillPercent = Math.max(0, Math.min(1, display - (idx - 1))) * 100;
                    return (
                        <span
                            key={idx}
                            onMouseEnter={() => interactive && setHover(idx)}
                            onMouseLeave={() => interactive && setHover(0)}
                            onClick={() => handleClick(idx)}
                            style={{
                                position: 'relative',
                                display: 'inline-block',
                                width: size,
                                height: size,
                                lineHeight: 0,
                            }}
                        >
                            {/* Background (empty) star */}
                            <svg
                                width={size}
                                height={size}
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                                style={{ position: 'absolute', inset: 0 }}
                            >
                                <path
                                    d="M12 2.5l2.95 6.32 6.96.78-5.21 4.74 1.49 6.83L12 17.77l-6.19 3.4 1.49-6.83L2.09 9.6l6.96-.78L12 2.5z"
                                    stroke="#d1d5db"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                    fill="#f3f4f6"
                                />
                            </svg>
                            {/* Foreground (filled) star — clipped by fillPercent */}
                            <span
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    overflow: 'hidden',
                                    width: `${fillPercent}%`,
                                    pointerEvents: 'none',
                                }}
                            >
                                <svg
                                    width={size}
                                    height={size}
                                    viewBox="0 0 24 24"
                                    fill={color}
                                    aria-hidden="true"
                                >
                                    <path d="M12 2.5l2.95 6.32 6.96.78-5.21 4.74 1.49 6.83L12 17.77l-6.19 3.4 1.49-6.83L2.09 9.6l6.96-.78L12 2.5z" />
                                </svg>
                            </span>
                        </span>
                    );
                })}
            </span>
            {showValue && (
                <span style={{ fontSize: size * 0.85, color: '#374151', fontWeight: 600 }}>
                    {Number(display).toFixed(1)}
                </span>
            )}
            {label && (
                <span style={{ fontSize: size * 0.85, color: '#6b7280' }}>{label}</span>
            )}
        </span>
    );
}
