import { useState, useCallback, useEffect, useRef } from 'react';
import {
    generateId,
    calcSlaDeadline,
    isSlaBreached,
    isTransitionAllowed,
    applySlaEscalation,
    validateResolutionNotes,
    canEscalate,
} from '../utils/incidentUtils';
import {
    appendAuditEntry,
    getAuditEntriesForIncident,
    getAllAuditEntries,
} from '../utils/auditLog';
import { STATUS, ROLES, MAX_ESCALATION_LEVEL } from '../constants';

const BLOCKED_ASSIGNEE_LOWER = ['reporter', 'admin'];

export function validateAssignee(assignedTo) {
    const t = (assignedTo ?? '').trim();
    if (!t) return null;
    if (BLOCKED_ASSIGNEE_LOWER.includes(t.toLowerCase())) {
        return `Cannot assign to "${t}" — must be a valid Resolver ID.`;
    }
    return null;
}

function buildIncident(fields, reportedBy) {
    const now = Date.now();
    return {
        id: generateId(),
        title: fields.title.trim(),
        description: fields.description.trim(),
        severity: fields.severity,
        reportedBy,
        assignedTo: fields.assignedTo?.trim() || null,
        status: STATUS.OPEN,
        escalationLevel: 0,
        createdAt: now,
        updatedAt: now,
        slaDeadline: calcSlaDeadline(now, fields.severity),
        resolutionNotes: '',
    };
}

export function useIncidents() {
    const [incidents, setIncidents] = useState([]);
    const [currentRole, setCurrentRole] = useState(ROLES.REPORTER);
    const [auditEntries, setAuditEntries] = useState([]);
    const timerRef = useRef(null);
    const incidentsRef = useRef(incidents);
    incidentsRef.current = incidents;

    function refreshAudit() {
        setAuditEntries([...getAllAuditEntries()]);
    }

    // ── SLA Auto-Escalation ticker ──────────────────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => {
            const current = incidentsRef.current;
            const auditBatch = [];
            const next = current.map(inc => {
                if (!isSlaBreached(inc)) return inc;
                const updated = applySlaEscalation(inc);
                if (updated === inc) return inc;
                auditBatch.push({
                    incidentId: inc.id,
                    prevStatus: inc.status,
                    newStatus: updated.status,
                    changedBy: 'System',
                    reason: 'Auto-escalated — SLA breached',
                });
                return updated;
            });

            const changed = next.some((inc, i) => inc !== current[i]);
            if (changed) {
                auditBatch.forEach(appendAuditEntry);
                setIncidents(next);
                refreshAudit();
            }
        }, 5000);
        return () => clearInterval(timerRef.current);
    }, []);

    // ── Create Incident ─────────────────────────────────────────────────────────
    const createIncident = useCallback(
        (fields) => {
            const incident = buildIncident(fields, currentRole);
            appendAuditEntry({
                incidentId: incident.id,
                prevStatus: '—',
                newStatus: STATUS.OPEN,
                changedBy: currentRole,
                reason: 'Incident created',
            });
            setIncidents(prev => [incident, ...prev]);
            refreshAudit();
            return incident;
        },
        [currentRole]
    );

    // ── Transition Status ───────────────────────────────────────────────────────
    const transitionStatus = useCallback(
        ({ incidentId, toStatus, resolutionNotes = '', reason = '' }) => {
            const inc = incidentsRef.current.find(i => i.id === incidentId);
            if (!inc) return;
            if (!isTransitionAllowed(inc.status, toStatus, currentRole)) return;
            if (validateResolutionNotes(resolutionNotes, toStatus)) return;

            appendAuditEntry({
                incidentId,
                prevStatus: inc.status,
                newStatus: toStatus,
                changedBy: currentRole,
                reason: reason.trim() || resolutionNotes.trim() || '',
            });

            setIncidents(prev => prev.map(i =>
                i.id !== incidentId ? i : {
                    ...i,
                    status: toStatus,
                    resolutionNotes: resolutionNotes.trim() || i.resolutionNotes,
                    updatedAt: Date.now(),
                }
            ));
            refreshAudit();
        },
        [currentRole]
    );

    // ── Assign Incident ─────────────────────────────────────────────────────────
    const assignIncident = useCallback(
        ({ incidentId, assignedTo, reason = '' }) => {
            if (currentRole !== ROLES.ADMIN) return { error: 'Only Admin can assign.' };
            const assignErr = validateAssignee(assignedTo);
            if (assignErr) return { error: assignErr };

            const inc = incidentsRef.current.find(i => i.id === incidentId);
            if (!inc) return { error: 'Incident not found.' };
            if (!isTransitionAllowed(inc.status, STATUS.ASSIGNED, currentRole)) {
                return { error: `Cannot transition from "${inc.status}" to Assigned.` };
            }

            appendAuditEntry({
                incidentId,
                prevStatus: inc.status,
                newStatus: STATUS.ASSIGNED,
                changedBy: currentRole,
                reason: reason.trim() || `Assigned to ${assignedTo}`,
            });
            setIncidents(prev => prev.map(i =>
                i.id !== incidentId ? i : {
                    ...i,
                    assignedTo: assignedTo.trim(),
                    status: STATUS.ASSIGNED,
                    updatedAt: Date.now(),
                }
            ));
            refreshAudit();
            return {};
        },
        [currentRole]
    );

    // ── Manual Escalate ─────────────────────────────────────────────────────────
    const manualEscalate = useCallback(
        ({ incidentId, reason = '' }) => {
            if (currentRole !== ROLES.ADMIN) return;
            const inc = incidentsRef.current.find(i => i.id === incidentId);
            if (!inc || !canEscalate(inc)) return;

            const newLevel = Math.min(inc.escalationLevel + 1, MAX_ESCALATION_LEVEL);
            appendAuditEntry({
                incidentId,
                prevStatus: inc.status,
                newStatus: STATUS.ESCALATED,
                changedBy: currentRole,
                reason: reason.trim() || 'Manual escalation by Admin',
            });
            setIncidents(prev => prev.map(i =>
                i.id !== incidentId ? i : {
                    ...i,
                    escalationLevel: newLevel,
                    status: STATUS.ESCALATED,
                    updatedAt: Date.now(),
                    assignedTo: newLevel >= MAX_ESCALATION_LEVEL ? 'Admin' : i.assignedTo,
                }
            ));
            refreshAudit();
        },
        [currentRole]
    );

    // ── Reassign Incident ───────────────────────────────────────────────────────
    const reassignIncident = useCallback(
        ({ incidentId, assignedTo, reason = '' }) => {
            if (currentRole !== ROLES.ADMIN) return { error: 'Only Admin can reassign.' };
            const assignErr = validateAssignee(assignedTo);
            if (assignErr) return { error: assignErr };

            const inc = incidentsRef.current.find(i => i.id === incidentId);
            if (!inc) return { error: 'Incident not found.' };

            appendAuditEntry({
                incidentId,
                prevStatus: inc.status,
                newStatus: inc.status,
                changedBy: currentRole,
                reason: reason.trim() || `Reassigned to ${assignedTo}`,
            });
            setIncidents(prev => prev.map(i =>
                i.id !== incidentId ? i : { ...i, assignedTo: assignedTo.trim(), updatedAt: Date.now() }
            ));
            refreshAudit();
            return {};
        },
        [currentRole]
    );

    // ── Role-filtered incident views ────────────────────────────────────────────
    const getVisibleIncidents = useCallback(() => {
        switch (currentRole) {
            case ROLES.REPORTER:
                return incidents.filter(i => i.reportedBy === ROLES.REPORTER);
            case ROLES.RESOLVER:
                return incidents.filter(
                    i => i.assignedTo && i.assignedTo.toLowerCase() !== 'admin'
                );
            case ROLES.ADMIN:
                return incidents;
            default:
                return [];
        }
    }, [incidents, currentRole]);

    const getAuditLog = useCallback(
        (incidentId) => getAuditEntriesForIncident(incidentId),
        [auditEntries] // eslint-disable-line
    );

    return {
        incidents,
        currentRole,
        setCurrentRole,
        createIncident,
        transitionStatus,
        assignIncident,
        manualEscalate,
        reassignIncident,
        getAuditLog,
        getVisibleIncidents,
        auditEntries,
    };
}
