import '../styles/SoccerField.css';

function SoccerField({ children }) {
  return (
    <div className="soccer-field">
      <svg
        className="soccer-field-svg"
        viewBox="0 0 1000 650"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect x="15" y="15" width="970" height="620" rx="18" className="soccer-field-border" />
        <rect x="30" y="30" width="940" height="590" rx="14" className="soccer-field-lines" />
        <line x1="500" y1="30" x2="500" y2="620" className="soccer-field-lines" />
        <circle cx="500" cy="325" r="80" className="soccer-field-lines" />
        <circle cx="500" cy="325" r="6" className="soccer-field-lines" />
        <rect x="30" y="185" width="140" height="280" className="soccer-field-lines" />
        <rect x="30" y="235" width="60" height="180" className="soccer-field-lines" />
        <rect x="830" y="185" width="140" height="280" className="soccer-field-lines" />
        <rect x="910" y="235" width="60" height="180" className="soccer-field-lines" />
        <circle cx="120" cy="325" r="70" className="soccer-field-lines" />
        <circle cx="880" cy="325" r="70" className="soccer-field-lines" />
      </svg>
      <div className="soccer-field-overlay">{children}</div>
    </div>
  );
}

export default SoccerField;
