import '../styles/SoccerField.css';

/* html2canvas는 CSS 클래스로 정의된 SVG fill/stroke를 읽지 못하므로 인라인 스타일 사용 */
const BORDER_STYLE = { fill: 'rgba(0,0,0,0.12)', stroke: 'rgba(255,255,255,0.45)', strokeWidth: 6 };
const LINE_STYLE = { fill: 'none', stroke: 'rgba(255,255,255,0.8)', strokeWidth: 3.5 };

function SoccerField({ children }) {
  return (
    <div className="soccer-field">
      <svg
        className="soccer-field-svg"
        viewBox="0 0 650 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect x="15" y="15" width="620" height="970" rx="18" style={BORDER_STYLE} />
        <rect x="30" y="30" width="590" height="940" rx="14" style={LINE_STYLE} />

        <line x1="30" y1="500" x2="620" y2="500" style={LINE_STYLE} />
        <circle cx="325" cy="500" r="80" style={LINE_STYLE} />
        <circle cx="325" cy="500" r="6" style={LINE_STYLE} />

        <rect x="185" y="30" width="280" height="140" style={LINE_STYLE} />
        <rect x="235" y="30" width="180" height="60" style={LINE_STYLE} />
        <circle cx="325" cy="120" r="5" style={LINE_STYLE} />
        <path d="M255 170 A70 70 0 0 0 395 170" style={LINE_STYLE} />

        <rect x="185" y="830" width="280" height="140" style={LINE_STYLE} />
        <rect x="235" y="910" width="180" height="60" style={LINE_STYLE} />
        <circle cx="325" cy="880" r="5" style={LINE_STYLE} />
        <path d="M255 830 A70 70 0 0 1 395 830" style={LINE_STYLE} />
      </svg>
      <div className="soccer-field-overlay">{children}</div>
    </div>
  );
}

export default SoccerField;
