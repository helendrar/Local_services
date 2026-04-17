import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import JobCard from '../components/JobCard';
import toast from 'react-hot-toast';
import api from '../api/axios';

function RespondModal({ assignment, onClose, onDone }) {
  const [action, setAction] = useState('accepted');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/jobs/respond', {
        assignment_id: assignment.assignment_id,
        action,
        provider_note: note,
      });
      toast.success(`Job ${action} successfully!`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Respond to Assignment</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Job summary */}
          <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
            <div style={{ fontWeight: 500 }}>{assignment.title}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
              Customer: {assignment.customer_name}
              {assignment.budget && ` · KSh ${Number(assignment.budget).toLocaleString()}`}
            </div>
          </div>

          {/* Action choice */}
          <div className="form-group">
            <label className="form-label">Your response</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { value: 'accepted', label: '✅ Accept Job', color: 'var(--success)' },
                { value: 'rejected', label: '❌ Decline',    color: 'var(--danger)' },
              ].map(opt => (
                <label key={opt.value} style={{
                  flex: 1, textAlign: 'center', padding: 12,
                  border: `2px solid ${action === opt.value ? opt.color : 'var(--gray-200)'}`,
                  borderRadius: 'var(--radius)', cursor: 'pointer',
                  background: action === opt.value ? `${opt.color}10` : '#fff',
                  fontSize: 14, fontWeight: action === opt.value ? 500 : 400,
                  transition: 'all .15s',
                }}>
                  <input type="radio" value={opt.value} checked={action === opt.value}
                    onChange={() => setAction(opt.value)} style={{ display: 'none' }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note to customer (optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={action === 'accepted'
                ? 'Any details about your availability…'
                : 'Reason for declining…'}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${action === 'accepted' ? 'btn-success' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Sending…</>
              : action === 'accepted' ? 'Confirm Accept' : 'Confirm Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssignedJobs() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [respondTo, setRespondTo] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/jobs/assigned')
      .then(r => setAssignments(r.data.assignments))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const counts = {
    pending:   assignments.filter(a => a.assignment_status === 'pending').length,
    accepted:  assignments.filter(a => a.assignment_status === 'accepted').length,
    completed: assignments.filter(a => a.assignment_status === 'completed').length,
    rejected:  assignments.filter(a => a.assignment_status === 'rejected').length,
  };

  const filtered = tab === 'all'
    ? assignments
    : assignments.filter(a => a.assignment_status === tab);

  return (
    <Layout title="My Assignments">
      {respondTo && (
        <RespondModal
          assignment={respondTo}
          onClose={() => setRespondTo(null)}
          onDone={() => { setRespondTo(null); load(); }}
        />
      )}

      <div className="mb-16">
        <h2>Job Assignments</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 2 }}>
          {counts.pending > 0 && (
            <span style={{ color: 'var(--warning)', fontWeight: 500 }}>
              ⚠️ {counts.pending} awaiting your response ·{' '}
            </span>
          )}
          {assignments.length} total
        </p>
      </div>

      <div className="tabs mb-16">
        {[
          { key: 'pending',   label: `Pending (${counts.pending})` },
          { key: 'accepted',  label: `Accepted (${counts.accepted})` },
          { key: 'completed', label: `Completed (${counts.completed})` },
          { key: 'rejected',  label: `Declined (${counts.rejected})` },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner spinner-dark" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">📭</span>
          <h3>No {tab} assignments</h3>
          <p>Make sure your profile is complete and verified to receive job assignments.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(a => (
            <JobCard
              key={a.assignment_id}
              job={a}
              role="provider"
              showCustomer={true}
              onRespond={setRespondTo}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
