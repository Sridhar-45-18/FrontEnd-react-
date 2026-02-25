import React from 'react';
import '../styles/EscalationBadge.css';

const LEVEL_META = [
    { label: 'Level 0', color: '#4caf50', icon: '🟢' },
    { label: 'Level 1', color: '#ff9800', icon: '🟡' },
    { label: 'Level 2', color: '#f44336', icon: '🔴' },
];

export function EscalationBadge({ level }) {
    const meta = LEVEL_META[level] ?? LEVEL_META[0];
    return (
        <span className="escalation-badge" style={{ '--badge-color': meta.color }}>
            {meta.icon} Escalation&nbsp;<strong>{meta.label}</strong>
        </span>
    );
}
