import '../styles/SoccerField.css';

function SoccerField({ children }) {
  return (
    <div className="soccer-field">
      <svg
        className="soccer-field-svg"
        viewBox="0 0 650 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect x="15" y="15" width="620" height="970" rx="18" className="soccer-field-border" />
        <rect x="30" y="30" width="590" height="940" rx="14" className="soccer-field-lines" />

        <line x1="30" y1="500" x2="620" y2="500" className="soccer-field-lines" />
        <circle cx="325" cy="500" r="80" className="soccer-field-lines" />
        <circle cx="325" cy="500" r="6" className="soccer-field-lines" />

        <rect x="185" y="30" width="280" height="140" className="soccer-field-lines" />
        <rect x="235" y="30" width="180" height="60" className="soccer-field-lines" />
        <circle cx="325" cy="120" r="5" className="soccer-field-lines" />
        <path d="M255 170 A70 70 0 0 0 395 170" className="soccer-field-lines" />

        <rect x="185" y="830" width="280" height="140" className="soccer-field-lines" />
        <rect x="235" y="910" width="180" height="60" className="soccer-field-lines" />
        <circle cx="325" cy="880" r="5" className="soccer-field-lines" />
        <path d="M255 830 A70 70 0 0 1 395 830" className="soccer-field-lines" />
      </svg>
      <div className="soccer-field-overlay">{children}</div>
    </div>
  );
}

export default SoccerField;
