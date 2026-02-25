import React from 'react';
import { formatTimestamp } from '../utils/incidentUtils';
import '../styles/AuditLog.css';

const ACTOR_COLORS = {
    Reporter: '#6c63ff',
    Resolver: '#00c8a0',
    Admin: '#f5a623',
    System: '#f85149',
};

export function AuditLog({ entries }) {
    if (!entries || entries.length === 0) {
        return (
            <div className="audit-empty">
                <span>🔍</span> No audit events yet.
            </div>
        );
    }

    // Show newest first
    const sorted = [...entries].reverse();

    return (
        <div className="audit-log">
            {sorted.map(entry => (
                <div key={entry.id} className="audit-entry">
                    <div className="audit-timeline-dot" />
                    <div className="audit-body">
                        <div className="audit-transition">
                            <span className="audit-status audit-prev">{entry.prevStatus}</span>
                            <span className="audit-arrow">→</span>
                            <span className="audit-status audit-next">{entry.newStatus}</span>
                        </div>
                        <div className="audit-meta">
                            <span
                                className="audit-actor"
                                style={{ '--actor-color': ACTOR_COLORS[entry.changedBy] ?? '#8b949e' }}
                            >
                                {entry.changedBy}
                            </span>
                            <span className="audit-time">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        {entry.reason && (
                            <div className="audit-reason">
                                <span className="audit-reason-label">Reason:</span> {entry.reason}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
