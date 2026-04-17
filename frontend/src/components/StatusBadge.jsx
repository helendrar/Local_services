/**
 * StatusBadge — shared badge component for job/assignment/verification statuses
 * Import from: '@/components/StatusBadge'
 */
export default function StatusBadge({ status }) {
  const map = {
    // Job statuses
    open:      { cls: 'badge-blue',    label: 'Open' },
    assigned:  { cls: 'badge-yellow',  label: 'Assigned' },
    completed: { cls: 'badge-green',   label: 'Completed' },
    cancelled: { cls: 'badge-gray',    label: 'Cancelled' },
    // Assignment statuses
    pending:   { cls: 'badge-yellow',  label: 'Pending' },
    accepted:  { cls: 'badge-green',   label: 'Accepted' },
    rejected:  { cls: 'badge-red',     label: 'Rejected' },
    // Verification statuses
    verified:  { cls: 'badge-green',   label: 'Verified' },
    // User roles
    customer:  { cls: 'badge-blue',    label: 'Customer' },
    provider:  { cls: 'badge-primary', label: 'Provider' },
    admin:     { cls: 'badge-gray',    label: 'Admin' },
    // Account status
    active:    { cls: 'badge-green',   label: 'Active' },
    suspended: { cls: 'badge-red',     label: 'Suspended' },
    // Urgency
    urgent:    { cls: 'badge-red',     label: 'Urgent' },
    normal:    { cls: 'badge-blue',    label: 'Normal' },
    low:       { cls: 'badge-gray',    label: 'Low' },
  };
  const { cls, label } = map[status] || { cls: 'badge-gray', label: status || '—' };
  return <span className={`badge ${cls}`}>{label}</span>;
}
