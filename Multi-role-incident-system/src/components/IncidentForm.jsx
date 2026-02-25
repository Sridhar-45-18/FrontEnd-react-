import React, { useState } from 'react';
import { SEVERITY, ROLES } from '../constants';
import { validateIncidentForm } from '../utils/incidentUtils';
import '../styles/IncidentForm.css';

const SEVERITY_OPTIONS = Object.values(SEVERITY);

export function IncidentForm({ currentRole, onSubmit }) {
    const [fields, setFields] = useState({
        title: '',
        description: '',
        severity: '',
        assignedTo: '',
    });
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    if (currentRole !== ROLES.REPORTER) return null;

    function handleChange(e) {
        const { name, value } = e.target;
        setFields(f => ({ ...f, [name]: value }));
        if (errors[name]) setErrors(e2 => ({ ...e2, [name]: undefined }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validateIncidentForm(fields);
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        onSubmit(fields);
        setFields({ title: '', description: '', severity: '', assignedTo: '' });
        setErrors({});
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    }

    return (
        <div className="incident-form-wrapper">
            <h2 className="form-title">
                <span className="form-title-icon">📋</span> Report New Incident
            </h2>
            {submitted && (
                <div className="success-banner">
                    ✅ Incident submitted successfully!
                </div>
            )}
            <form className="incident-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="title">Title <span className="required">*</span></label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={fields.title}
                        onChange={handleChange}
                        placeholder="Minimum 8 characters"
                        className={errors.title ? 'error' : ''}
                        autoComplete="off"
                    />
                    {errors.title && <span className="inline-error">{errors.title}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description <span className="required">*</span></label>
                    <textarea
                        id="description"
                        name="description"
                        value={fields.description}
                        onChange={handleChange}
                        placeholder="Minimum 20 characters — describe the incident in detail"
                        rows={4}
                        className={errors.description ? 'error' : ''}
                    />
                    {errors.description && <span className="inline-error">{errors.description}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="severity">Severity <span className="required">*</span></label>
                        <select
                            id="severity"
                            name="severity"
                            value={fields.severity}
                            onChange={handleChange}
                            className={errors.severity ? 'error' : ''}
                        >
                            <option value="">— Select severity —</option>
                            {SEVERITY_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        {errors.severity && <span className="inline-error">{errors.severity}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="assignedTo">Assign To (optional)</label>
                        <input
                            id="assignedTo"
                            name="assignedTo"
                            type="text"
                            value={fields.assignedTo}
                            onChange={handleChange}
                            placeholder="Resolver ID"
                        />
                    </div>
                </div>

                <button type="submit" className="submit-btn">
                    Submit Incident
                </button>
            </form>
        </div>
    );
}
