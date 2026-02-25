import React, { useState } from 'react';
import { useIncidents } from './hooks/useIncidents';
import { RoleSwitcher } from './components/RoleSwitcher';
import { IncidentForm } from './components/IncidentForm';
import { IncidentList } from './components/IncidentList';
import { IncidentDetail } from './components/IncidentDetail';
import './styles/global.css';

function App() {
  const {
    incidents,
    currentRole,
    setCurrentRole,
    createIncident,
    transitionStatus,
    assignIncident,
    manualEscalate,
    reassignIncident,
    getVisibleIncidents,
    auditEntries,
  } = useIncidents();

  const [selectedId, setSelectedId] = useState(null);

  // Always read the live version of the selected incident
  const liveSelectedIncident = selectedId
    ? incidents.find(i => i.id === selectedId) ?? null
    : null;

  function handleRoleChange(role) {
    setCurrentRole(role);
    // Do NOT close detail — maintain state integrity across role switches
  }

  const visibleIncidents = getVisibleIncidents();

  return (
    <div className="app">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">⚡</span>
          <div>
            <h1 className="header-title">Incident Escalation & SLA Tracker</h1>
            <p className="header-subtitle">Enterprise Multi-Role System</p>
          </div>
        </div>
        <RoleSwitcher currentRole={currentRole} onRoleChange={handleRoleChange} />
      </header>

      {/* Main Layout */}
      <main className="app-main">
        {/* Left Sidebar */}
        <aside className="app-sidebar">
          <IncidentForm currentRole={currentRole} onSubmit={createIncident} />

          <div className="stats-panel">
            <h3 className="stats-title">System Overview</h3>
            <div className="stats-grid">
              {['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'].map(s => (
                <div className="stat-card" key={s}>
                  <span className="stat-count">{incidents.filter(i => i.status === s).length}</span>
                  <span className="stat-label">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-panel">
            <h3 className="stats-title">Audit Log — All Events</h3>
            <div className="global-audit-count">
              <span className="stat-count">{auditEntries.length}</span>
              <span className="stat-label">Total entries</span>
            </div>
          </div>
        </aside>

        {/* Right Content */}
        <section className="app-content">
          <div className="content-header">
            <h2 className="content-title">
              Incidents
              <span className="count-badge">{visibleIncidents.length}</span>
            </h2>
            <p className="content-role-hint">
              {currentRole === 'Reporter' && 'Showing: your reported incidents'}
              {currentRole === 'Resolver' && 'Showing: incidents assigned to Resolvers'}
              {currentRole === 'Admin' && 'Showing: all incidents'}
            </p>
          </div>

          <IncidentList
            incidents={visibleIncidents}
            currentRole={currentRole}
            onSelectIncident={inc => setSelectedId(inc.id)}
          />
        </section>
      </main>

      {/* Detail Modal */}
      {liveSelectedIncident && (
        <IncidentDetail
          incident={liveSelectedIncident}
          currentRole={currentRole}
          auditEntries={auditEntries}
          onTransition={transitionStatus}
          onAssign={assignIncident}
          onManualEscalate={manualEscalate}
          onReassign={reassignIncident}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default App;
