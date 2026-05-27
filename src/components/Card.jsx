import '../styles/Card.css';

/**
 * Card 컴포넌트
 * @param {string} variant - 카드 타입: 'default' (기본), 'primary', 'team-a', 'team-b'
 * @param {string} size - 카드 크기: 'sm', 'base' (기본), 'lg'
 * @param {boolean} interactive - 상호작용 가능 여부
 * @param {boolean} disabled - 비활성화 여부
 * @param {ReactNode} header - 카드 헤더 내용
 * @param {ReactNode} children - 카드 바디 내용
 * @param {ReactNode} footer - 카드 푸터 내용
 */
function Card({
  variant = 'default',
  size = 'base',
  interactive = false,
  disabled = false,
  header,
  children,
  footer,
  className = '',
  onClick,
  ...props
}) {
  // 클래스명 조합
  const cardClass = [
    'card',
    variant !== 'default' && `card-${variant}`,
    size !== 'base' && `card-${size}`,
    interactive && 'interactive',
    disabled && 'disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClass}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {header && <div className="card-header">{header}</div>}

      {children && <div className="card-body">{children}</div>}

      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

export default Card;
