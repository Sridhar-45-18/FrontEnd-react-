import React, { useState } from 'react';
import { ROLES, STATUS } from '../constants';
import { formatTimestamp } from '../utils/incidentUtils';
import { SLACountdown } from './SLACountdown';
import { EscalationBadge } from './EscalationBadge';
import { ActionButtons } from './ActionButtons';
import { AuditLog } from './AuditLog';
import '../styles/IncidentDetail.css';

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

export function IncidentDetail({
    incident,
    currentRole,
    auditEntries,
    onTransition,
    onAssign,
    onManualEscalate,
    onReassign,
    onClose,
}) {
    const [activeTab, setActiveTab] = useState('details');
    if (!incident) return null;

    const incidentAudit = auditEntries.filter(e => e.incidentId === incident.id);

    return (
        <div className="incident-detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="incident-detail">
                {/* Header */}
                <div className="detail-header">
                    <div className="detail-id-row">
                        <span className="detail-id">{incident.id}</span>
                        <span className="detail-status-badge" style={{ '--status-color': STATUS_COLORS[incident.status] }}>
                            {incident.status}
                        </span>
                    </div>
                    <h2 className="detail-title">{incident.title}</h2>
                    <button className="detail-close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* Badges row */}
                <div className="detail-badges-row">
                    <span className="severity-badge" style={{ '--sev-color': SEVERITY_COLORS[incident.severity] }}>
                        {incident.severity}
                    </span>
                    <EscalationBadge level={incident.escalationLevel} />
                    <SLACountdown slaDeadline={incident.slaDeadline} status={incident.status} />
                </div>

                {/* Tabs */}
                <div className="detail-tabs">
                    <button
                        className={`detail-tab ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        📋 Details
                    </button>
                    <button
                        className={`detail-tab ${activeTab === 'audit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audit')}
                    >
                        🗂 Audit Log
                        <span className="tab-count">{incidentAudit.length}</span>
                    </button>
                </div>

                {/* Tab: Details */}
                {activeTab === 'details' && (
                    <>
                        <div className="detail-grid">
                            <div className="detail-field full-width">
                                <span className="field-label">Description</span>
                                <span className="field-value desc">{incident.description}</span>
                            </div>
                            <div className="detail-field">
                                <span className="field-label">Reported By</span>
                                <span className="field-value">{incident.reportedBy}</span>
                            </div>
                            <div className="detail-field">
                                <span className="field-label">Assigned To</span>
                                <span className="field-value">{incident.assignedTo || '— Not assigned —'}</span>
                            </div>
                            <div className="detail-field">
                                <span className="field-label">Created At</span>
                                <span className="field-value">{formatTimestamp(incident.createdAt)}</span>
                            </div>
                            <div className="detail-field">
                                <span className="field-label">Updated At</span>
                                <span className="field-value">{formatTimestamp(incident.updatedAt)}</span>
                            </div>
                            <div className="detail-field">
                                <span className="field-label">SLA Deadline</span>
                                <span className="field-value">{formatTimestamp(incident.slaDeadline)}</span>
                            </div>
                            {incident.resolutionNotes && (
                                <div className="detail-field full-width">
                                    <span className="field-label">Resolution Notes</span>
                                    <span className="field-value notes">{incident.resolutionNotes}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="detail-actions">
                            {currentRole === ROLES.REPORTER ? (
                                <p className="reporter-notice">Reporters can only view incidents they created.</p>
                            ) : (
                                <ActionButtons
                                    incident={incident}
                                    currentRole={currentRole}
                                    onTransition={onTransition}
                                    onAssign={onAssign}
                                    onManualEscalate={onManualEscalate}
                                    onReassign={onReassign}
                                />
                            )}
                        </div>
                    </>
                )}

                {/* Tab: Audit Log */}
                {activeTab === 'audit' && (
                    <div className="audit-tab-content">
                        <p className="audit-intro">
                            Immutable history — every status change is recorded automatically.
                        </p>
                        <AuditLog entries={incidentAudit} />
                    </div>
                )}
            </div>
        </div>
    );
}
