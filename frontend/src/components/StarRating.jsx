export const StarDisplay = ({ rating = 0, size = 14 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#f59e0b' : '#e5e7eb' }}>
        ★
      </span>
    );
  }
  return <span style={{ letterSpacing: 1 }}>{stars}</span>;
};

export const StarInput = ({ value, onChange }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= value ? 'active' : ''}`}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
};
