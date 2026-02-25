import React, { useState, useEffect } from 'react';
import { formatCountdown } from '../utils/incidentUtils';
import '../styles/SLACountdown.css';

export function SLACountdown({ slaDeadline, status }) {
    const [remaining, setRemaining] = useState(slaDeadline - Date.now());
    const isTerminal = ['Resolved', 'Closed'].includes(status);

    useEffect(() => {
        if (isTerminal) return;
        const interval = setInterval(() => {
            setRemaining(slaDeadline - Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [slaDeadline, isTerminal]);

    const breached = remaining <= 0;
    const urgent = remaining > 0 && remaining < 30 * 60 * 1000; // < 30 min

    if (isTerminal) {
        return (
            <span className="sla-countdown sla-done">
                ✅ SLA Closed
            </span>
        );
    }

    return (
        <span className={`sla-countdown ${breached ? 'sla-breached' : urgent ? 'sla-urgent' : 'sla-ok'}`}>
            <span className="sla-icon">{breached ? '🔴' : urgent ? '🟡' : '🟢'}</span>
            <span className="sla-timer">
                {breached ? 'BREACHED' : formatCountdown(remaining)}
            </span>
        </span>
    );
}
