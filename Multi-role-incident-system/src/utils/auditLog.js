/**
 * Audit Log — Immutable History
 * 
 * Each entry records every status change event:
 *   incidentId    — which incident
 *   prevStatus    — state before the change
 *   newStatus     — state after the change
 *   changedBy     — role that triggered (Reporter/Resolver/Admin/System)
 *   timestamp     — exact ms timestamp
 *   reason        — mandatory for Admin overrides, optional otherwise
 */

let auditLog = [];

/**
 * Append a new immutable audit entry. Returns the new entry (read-only copy).
 */
export function appendAuditEntry({ incidentId, prevStatus, newStatus, changedBy, reason = '' }) {
    const entry = Object.freeze({
        id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        incidentId,
        prevStatus,
        newStatus,
        changedBy,
        timestamp: Date.now(),
        reason: reason.trim(),
    });
    auditLog = [...auditLog, entry];
    return entry;
}

/**
 * Get all audit entries for a specific incident, ordered oldest → newest.
 */
export function getAuditEntriesForIncident(incidentId) {
    return auditLog.filter(e => e.incidentId === incidentId);
}

/**
 * Get the full audit log (all incidents). Read-only.
 */
export function getAllAuditEntries() {
    return auditLog;
}
