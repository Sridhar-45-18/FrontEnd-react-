import React, { useState } from 'react';
import { STATUS, ROLES } from '../constants';
import { isTransitionAllowed, validateResolutionNotes, canEscalate } from '../utils/incidentUtils';
import '../styles/ActionButtons.css';

export function ActionButtons({
    incident,
    currentRole,
    onTransition,
    onAssign,
    onManualEscalate,
    onReassign,
}) {
    const [assignInput, setAssignInput] = useState('');
    const [assignError, setAssignError] = useState('');
    const [assignMode, setAssignMode] = useState(null); // null | 'assign' | 'reassign'
    const [notesInput, setNotesInput] = useState('');
    const [reasonInput, setReasonInput] = useState('');
    const [pendingTransition, setPendingTransition] = useState(null);
    const [notesError, setNotesError] = useState('');
    const [escalateReason, setEscalateReason] = useState('');
    const [showEscalateInput, setShowEscalateInput] = useState(false);

    // ── Status transition buttons ─────────────────────────────────────────────
    const btnConfig = [
        {
            label: '▶ Start Progress',
            toStatus: STATUS.IN_PROGRESS,
            visible: currentRole === ROLES.RESOLVER,
        },
        {
            label: '✅ Mark Resolved',
            toStatus: STATUS.RESOLVED,
            visible: currentRole === ROLES.RESOLVER,
            requiresNotes: true,
        },
        {
            label: '🔒 Close Incident',
            toStatus: STATUS.CLOSED,
            visible: currentRole === ROLES.ADMIN,
            requiresNotes: true,
        },
    ];

    function handleTransitionClick(toStatus, requiresNotes) {
        if (requiresNotes) {
            setPendingTransition(toStatus);
            setNotesError('');
            return;
        }
        onTransition({ incidentId: incident.id, toStatus });
    }

    function handleNotesModalSubmit() {
        const noteErr = validateResolutionNotes(notesInput, pendingTransition);
        if (noteErr) { setNotesError(noteErr); return; }
        if (currentRole === ROLES.ADMIN && !reasonInput.trim()) {
            setNotesError('Admin must provide a reason for this action.');
            return;
        }
        onTransition({
            incidentId: incident.id,
            toStatus: pendingTransition,
            resolutionNotes: notesInput,
            reason: reasonInput,
        });
        setNotesInput(''); setReasonInput(''); setPendingTransition(null); setNotesError('');
    }

    // ── Assign ────────────────────────────────────────────────────────────────
    function handleAssignConfirm() {
        if (!assignInput.trim()) { setAssignError('Resolver ID is required.'); return; }
        const result = onAssign({ incidentId: incident.id, assignedTo: assignInput });
        if (result?.error) { setAssignError(result.error); return; }
        setAssignInput(''); setAssignError(''); setAssignMode(null);
    }

    function handleReassignConfirm() {
        if (!assignInput.trim()) { setAssignError('Resolver ID is required.'); return; }
        const result = onReassign({ incidentId: incident.id, assignedTo: assignInput });
        if (result?.error) { setAssignError(result.error); return; }
        setAssignInput(''); setAssignError(''); setAssignMode(null);
    }

    // ── Manual Escalate ───────────────────────────────────────────────────────
    function handleEscalateConfirm() {
        if (!escalateReason.trim()) return;
        onManualEscalate({ incidentId: incident.id, reason: escalateReason });
        setEscalateReason(''); setShowEscalateInput(false);
    }

    const adminCanAct = currentRole === ROLES.ADMIN;
    const resolverCanAct = currentRole === ROLES.RESOLVER;

    return (
        <div className="action-buttons">

            {/* ── Status transition buttons ─────────────────────────────────────── */}
            {btnConfig.map(({ label, toStatus, visible, requiresNotes }) => {
                if (!visible) return null;
                const allowed = isTransitionAllowed(incident.status, toStatus, currentRole);
                return (
                    <button
                        key={toStatus}
                        className={`action-btn ${allowed ? 'btn-primary' : 'btn-disabled'}`}
                        disabled={!allowed}
                        title={!allowed ? `Transition from "${incident.status}" → "${toStatus}" is not permitted` : ''}
                        onClick={() => allowed && handleTransitionClick(toStatus, requiresNotes)}
                    >
                        {label}
                    </button>
                );
            })}

            {/* ── Admin: Assign ─────────────────────────────────────────────────── */}
            {adminCanAct && isTransitionAllowed(incident.status, STATUS.ASSIGNED, ROLES.ADMIN) && (
                <div className="assign-block">
                    {assignMode !== 'assign' ? (
                        <button className="action-btn btn-assign" onClick={() => { setAssignMode('assign'); setAssignError(''); }}>
                            👤 Assign to Resolver
                        </button>
                    ) : (
                        <div className="assign-input-group">
                            <input
                                type="text"
                                placeholder="Resolver ID (not Reporter/Admin)"
                                value={assignInput}
                                onChange={e => { setAssignInput(e.target.value); setAssignError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleAssignConfirm()}
                            />
                            <button className="action-btn btn-confirm" onClick={handleAssignConfirm}>Assign</button>
                            <button className="action-btn btn-cancel" onClick={() => setAssignMode(null)}>Cancel</button>
                            {assignError && <span className="inline-error assign-err">{assignError}</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ── Admin: Reassign ───────────────────────────────────────────────── */}
            {adminCanAct && incident.status !== STATUS.CLOSED && (
                <div className="assign-block">
                    {assignMode !== 'reassign' ? (
                        <button className="action-btn btn-reassign"
                            onClick={() => { setAssignMode('reassign'); setAssignError(''); }}>
                            🔄 Reassign
                        </button>
                    ) : (
                        <div className="assign-input-group">
                            <input
                                type="text"
                                placeholder="New Resolver ID"
                                value={assignInput}
                                onChange={e => { setAssignInput(e.target.value); setAssignError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleReassignConfirm()}
                            />
                            <button className="action-btn btn-confirm" onClick={handleReassignConfirm}>Reassign</button>
                            <button className="action-btn btn-cancel" onClick={() => setAssignMode(null)}>Cancel</button>
                            {assignError && <span className="inline-error assign-err">{assignError}</span>}
                        </div>
                    )}
                </div>
            )}

            {/* ── Admin: Manual Escalate ────────────────────────────────────────── */}
            {adminCanAct && (
                <div className="assign-block">
                    {!showEscalateInput ? (
                        <button
                            className={`action-btn btn-escalate ${canEscalate(incident) ? '' : 'btn-disabled'}`}
                            disabled={!canEscalate(incident)}
                            title={!canEscalate(incident) ? 'Maximum escalation level (2) reached' : ''}
                            onClick={() => canEscalate(incident) && setShowEscalateInput(true)}
                        >
                            🚨 Manual Escalate
                        </button>
                    ) : (
                        <div className="assign-input-group">
                            <input
                                type="text"
                                placeholder="Reason for escalation (required)"
                                value={escalateReason}
                                onChange={e => setEscalateReason(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEscalateConfirm()}
                                style={{ flex: 2 }}
                            />
                            <button
                                className={`action-btn btn-confirm ${!escalateReason.trim() ? 'btn-disabled' : ''}`}
                                disabled={!escalateReason.trim()}
                                onClick={handleEscalateConfirm}
                            >
                                Escalate
                            </button>
                            <button className="action-btn btn-cancel" onClick={() => setShowEscalateInput(false)}>Cancel</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Resolution Notes + Reason Modal ──────────────────────────────── */}
            {pendingTransition && (
                <div className="notes-overlay">
                    <div className="notes-modal">
                        <h3>Confirm: {pendingTransition}</h3>
                        <p>Transitioning to <strong>{pendingTransition}</strong> requires resolution notes.</p>

                        <label className="modal-label">Resolution Notes <span className="required">*</span></label>
                        <textarea
                            placeholder="Enter detailed resolution notes…"
                            value={notesInput}
                            onChange={e => { setNotesInput(e.target.value); setNotesError(''); }}
                            rows={3}
                        />

                        {currentRole === ROLES.ADMIN && (
                            <>
                                <label className="modal-label">
                                    Admin Override Reason <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Mandatory reason for Admin override…"
                                    value={reasonInput}
                                    onChange={e => { setReasonInput(e.target.value); setNotesError(''); }}
                                />
                            </>
                        )}

                        {notesError && <span className="inline-error">{notesError}</span>}

                        <div className="notes-actions">
                            <button className="action-btn btn-primary" onClick={handleNotesModalSubmit}>
                                Confirm
                            </button>
                            <button className="action-btn btn-cancel"
                                onClick={() => { setPendingTransition(null); setNotesError(''); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
