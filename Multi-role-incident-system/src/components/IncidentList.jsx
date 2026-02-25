import React from 'react';
import { ROLES, STATUS } from '../constants';
import { SLACountdown } from './SLACountdown';
import { EscalationBadge } from './EscalationBadge';
import { formatTimestamp } from '../utils/incidentUtils';
import '../styles/IncidentList.css';

const STATUS_COLORS = {
    [STATUS.OPEN]: '#6c63ff',
    [STATUS.ASSIGNED]: '#2196f3',
    [STATUS.IN_PROGRESS]: '#ff9800',
    [STATUS.RESOLVED]: '#4caf50',
    [STATUS.CLOSED]: '#607d8b',
    [STATUS.ESCALATED]: '#f44336',
};

const SEVERITY_COLORS = {
    Critical: '#f44336',
    High: '#ff9800',
    Medium: '#2196f3',
    Low: '#4caf50',
};

function IncidentCard({ incident, onClick }) {
    return (
        <div className="incident-card" onClick={() => onClick(incident)}>
            <div className="card-top">
                <span className="card-id">{incident.id}</span>
                <span className="card-status" style={{ '--status-color': STATUS_COLORS[incident.status] }}>
                    {incident.status}
                </span>
            </div>
            <h3 className="card-title">{incident.title}</h3>
            <div className="card-meta">
                <span className="card-severity" style={{ '--sev-color': SEVERITY_COLORS[incident.severity] }}>
                    {incident.severity}
                </span>
                <EscalationBadge level={incident.escalationLevel} />
                <SLACountdown slaDeadline={incident.slaDeadline} status={incident.status} />
            </div>
            <div className="card-footer">
                <span>By: {incident.reportedBy}</span>
                <span>{formatTimestamp(incident.createdAt)}</span>
            </div>
        </div>
    );
}

export function IncidentList({ incidents, currentRole, onSelectIncident }) {
    // Role-based filtering: Reporters see only incidents they reported
    const visible =
        currentRole === ROLES.REPORTER
            ? incidents.filter(i => i.reportedBy === ROLES.REPORTER)
            : incidents;

    if (visible.length === 0) {
        return (
            <div className="incident-list-empty">
                <div className="empty-icon">📂</div>
                <p>No incidents to display.</p>
                {currentRole === ROLES.REPORTER && (
                    <p className="empty-hint">Use the form above to report your first incident.</p>
                )}
            </div>
        );
    }

    return (
        <div className="incident-list">
            {visible.map(inc => (
                <IncidentCard key={inc.id} incident={inc} onClick={onSelectIncident} />
            ))}
        </div>
    );
}
