import React from 'react';
import { ROLES } from '../constants';
import '../styles/RoleSwitcher.css';

const ROLE_COLORS = {
    [ROLES.REPORTER]: '#6c63ff',
    [ROLES.RESOLVER]: '#00c8a0',
    [ROLES.ADMIN]: '#f5a623',
};

const ROLE_ICONS = {
    [ROLES.REPORTER]: '🧑‍💼',
    [ROLES.RESOLVER]: '🔧',
    [ROLES.ADMIN]: '🛡️',
};

export function RoleSwitcher({ currentRole, onRoleChange }) {
    return (
        <div className="role-switcher">
            <span className="role-label">Active Role:</span>
            <div className="role-buttons">
                {Object.values(ROLES).map(role => (
                    <button
                        key={role}
                        className={`role-btn ${currentRole === role ? 'active' : ''}`}
                        style={currentRole === role ? { '--role-color': ROLE_COLORS[role] } : {}}
                        onClick={() => onRoleChange(role)}
                        aria-pressed={currentRole === role}
                    >
                        <span className="role-icon">{ROLE_ICONS[role]}</span>
                        {role}
                    </button>
                ))}
            </div>
            <div className="role-badge" style={{ '--role-color': ROLE_COLORS[currentRole] }}>
                <span>{ROLE_ICONS[currentRole]}</span>
                <span>Logged in as <strong>{currentRole}</strong></span>
            </div>
        </div>
    );
}
