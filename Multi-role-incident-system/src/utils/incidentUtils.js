import {
    STATUS,
    TRANSITIONS,
    SLA_DURATION_MS,
    MAX_ESCALATION_LEVEL,
    REQUIRES_NOTES,
} from '../constants';

// ─── ID Generator ─────────────────────────────────────────────────────────────
export function generateId() {
    return 'INC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ─── SLA ──────────────────────────────────────────────────────────────────────
export function calcSlaDeadline(createdAt, severity) {
    return createdAt + (SLA_DURATION_MS[severity] ?? 0);
}

export function isSlaBreached(incident, now = Date.now()) {
    if ([STATUS.RESOLVED, STATUS.CLOSED].includes(incident.status)) return false;
    return now > incident.slaDeadline;
}

// ─── State Machine ────────────────────────────────────────────────────────────
/**
 * Returns the list of allowed transitions from currentStatus for a given role.
 */
export function getAllowedTransitions(currentStatus, role) {
    const transitions = TRANSITIONS[currentStatus] ?? [];
    return transitions
        .filter(t => t.roles.includes(role))
        .map(t => t.to);
}

/**
 * Returns true if moving from currentStatus → nextStatus is valid for role.
 */
export function isTransitionAllowed(currentStatus, nextStatus, role) {
    return getAllowedTransitions(currentStatus, role).includes(nextStatus);
}

// ─── Escalation ───────────────────────────────────────────────────────────────
export function canEscalate(incident) {
    return incident.escalationLevel < MAX_ESCALATION_LEVEL;
}

/**
 * Applies SLA-breach escalation to an incident (returns new incident object).
 * Never exceeds MAX_ESCALATION_LEVEL.
 */
export function applySlaEscalation(incident, now = Date.now()) {
    if (!isSlaBreached(incident, now)) return incident;
    if (incident.status === STATUS.ESCALATED && incident.escalationLevel >= MAX_ESCALATION_LEVEL) {
        return incident; // Already at max; no change
    }

    const newLevel = Math.min(incident.escalationLevel + 1, MAX_ESCALATION_LEVEL);
    const updates = {
        escalationLevel: newLevel,
        status: STATUS.ESCALATED,
        updatedAt: now,
    };
    if (newLevel >= MAX_ESCALATION_LEVEL) {
        // Auto-assign to Admin at level 2
        updates.assignedTo = 'Admin';
    }
    return { ...incident, ...updates };
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function validateIncidentForm(fields) {
    const errors = {};

    const title = fields.title?.trim() ?? '';
    if (!title) {
        errors.title = 'Title is required.';
    } else if (title.length < 8) {
        errors.title = 'Title must be at least 8 characters.';
    }

    const desc = fields.description?.trim() ?? '';
    if (!desc) {
        errors.description = 'Description is required.';
    } else if (desc.length < 20) {
        errors.description = 'Description must be at least 20 characters.';
    }

    if (!fields.severity) {
        errors.severity = 'Severity is required.';
    }

    return errors;
}

export function validateResolutionNotes(notes, toStatus) {
    if (!REQUIRES_NOTES.includes(toStatus)) return null;
    const trimmed = notes?.trim() ?? '';
    if (!trimmed) return 'Resolution Notes are required for this transition.';
    return null;
}

// ─── Formatting ───────────────────────────────────────────────────────────────
export function formatCountdown(ms) {
    if (ms <= 0) return 'BREACHED';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimestamp(ts) {
    return new Date(ts).toLocaleString();
}
