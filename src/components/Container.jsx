import '../styles/Layout.css';

/**
 * Container 컴포넌트
 * 최대 너비를 설정하고 중앙 정렬하는 컨테이너
 * @param {string} size - 컨테이너 크기: 'sm', 'base' (기본), 'lg'
 * @param {ReactNode} children - 컨테이너 내용
 * @param {string} className - 추가 클래스명
 */
function Container({
  size = 'base',
  children,
  className = '',
  ...props
}) {
  const containerClass = [
    'container',
    size !== 'base' && `container-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} {...props}>
      {children}
    </div>
  );
}

export default Container;
