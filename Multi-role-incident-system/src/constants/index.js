// ─── Roles ───────────────────────────────────────────────────────────────────
export const ROLES = {
  REPORTER: 'Reporter',
  RESOLVER: 'Resolver',
  ADMIN: 'Admin',
};

// ─── Statuses ─────────────────────────────────────────────────────────────────
export const STATUS = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated',
};

// ─── Severity ─────────────────────────────────────────────────────────────────
export const SEVERITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

// SLA durations in milliseconds
export const SLA_DURATION_MS = {
  [SEVERITY.CRITICAL]: 4 * 60 * 60 * 1000,   // 4 hours
  [SEVERITY.HIGH]:     8 * 60 * 60 * 1000,   // 8 hours
  [SEVERITY.MEDIUM]:  24 * 60 * 60 * 1000,   // 24 hours
  [SEVERITY.LOW]:     48 * 60 * 60 * 1000,   // 48 hours
};

// ─── State Machine ────────────────────────────────────────────────────────────
// Maps current status → { allowedNextStatuses, allowedRoles[] }
// 'SYSTEM' means triggered automatically (by SLA breach / timer)
export const TRANSITIONS = {
  [STATUS.OPEN]: [
    { to: STATUS.ASSIGNED,  roles: [ROLES.ADMIN] },
    { to: STATUS.ESCALATED, roles: [ROLES.ADMIN, 'SYSTEM'] },
  ],
  [STATUS.ASSIGNED]: [
    { to: STATUS.IN_PROGRESS, roles: [ROLES.RESOLVER] },
    { to: STATUS.ESCALATED,   roles: [ROLES.ADMIN, 'SYSTEM'] },
  ],
  [STATUS.IN_PROGRESS]: [
    { to: STATUS.RESOLVED,  roles: [ROLES.RESOLVER] },
    { to: STATUS.ESCALATED, roles: [ROLES.ADMIN, 'SYSTEM'] },
  ],
  [STATUS.RESOLVED]: [
    { to: STATUS.CLOSED, roles: [ROLES.ADMIN] },
  ],
  [STATUS.CLOSED]: [],
  [STATUS.ESCALATED]: [
    { to: STATUS.ASSIGNED,    roles: [ROLES.ADMIN] },
    { to: STATUS.IN_PROGRESS, roles: [ROLES.RESOLVER] },
    { to: STATUS.RESOLVED,    roles: [ROLES.RESOLVER] },
    { to: STATUS.CLOSED,      roles: [ROLES.ADMIN] },
  ],
};

// Statuses that require Resolution Notes
export const REQUIRES_NOTES = [STATUS.RESOLVED, STATUS.CLOSED];

export const MAX_ESCALATION_LEVEL = 2;
