import '../styles/Input.css';

/**
 * Input 컴포넌트
 * @param {string} label - 입력 필드 레이블
 * @param {string} type - 입력 타입: 'text', 'number', 'email', 'password', 'date', 'time' 등
 * @param {string} placeholder - 플레이스홀더 텍스트
 * @param {string} value - 입력 값
 * @param {function} onChange - 변경 이벤트 핸들러
 * @param {string} error - 에러 메시지
 * @param {string} hint - 도움말 텍스트
 * @param {boolean} required - 필수 필드 여부
 * @param {boolean} disabled - 비활성화 여부
 * @param {string} size - 입력 필드 크기: 'sm', 'base' (기본), 'lg'
 */
function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  size = 'base',
  className = '',
  ...props
}) {
  // 입력 필드 클래스명 조합
  const inputClass = [
    'input-field',
    size !== 'base' && `input-${size}`,
    error && 'error',
    !error && value && 'success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="input-group">
      {label && (
        <label>
          {label}
          {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}

      <div className="input-wrapper">
        <input
          type={type}
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
      </div>

      {error && <div className="input-error">{error}</div>}
      {!error && hint && <div className="input-hint">{hint}</div>}
    </div>
  );
}

export default Input;
