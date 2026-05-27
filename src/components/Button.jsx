import '../styles/Button.css';

/**
 * Button 컴포넌트
 * @param {string} variant - 버튼 타입: 'primary' (기본), 'secondary', 'danger', 'success'
 * @param {string} size - 버튼 크기: 'sm', 'base' (기본), 'lg'
 * @param {boolean} disabled - 비활성화 여부
 * @param {boolean} fullWidth - 전체 너비 여부
 * @param {boolean} loading - 로딩 상태
 * @param {function} onClick - 클릭 이벤트 핸들러
 * @param {ReactNode} children - 버튼 텍스트 또는 컨텐츠
 */
function Button({
  variant = 'primary',
  size = 'base',
  disabled = false,
  fullWidth = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  // 클래스명 조합
  const buttonClass = [
    'btn',
    `btn-${variant}`,
    size !== 'base' && `btn-${size}`,
    fullWidth && 'btn-block',
    loading && 'loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? '처리 중...' : children}
    </button>
  );
}

export default Button;
