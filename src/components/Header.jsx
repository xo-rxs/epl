import { useState } from 'react';
import '../styles/Header.css';
import Button from './Button';
import { useAuthData } from '../hooks';

/**
 * Header 컴포넌트
 * @param {string} title - 헤더 제목
 * @param {string} subtitle - 헤더 부제목
 * @param {ReactNode} logo - 로고 아이콘
 * @param {Array} navItems - 네비게이션 항목 배열 [{label, href, active}]
 * @param {ReactNode} actions - 헤더 액션 (버튼 등)
 */
function Header({
  title = 'EPL',
  subtitle = 'Easy Pick League',
  logo = '⚽',
  navItems = [],
  actions,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuthData();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* 로고/브랜드 */}
        <a href="/" className="header-logo">
          <span className="header-logo-icon">{logo}</span>
          <div className="header-logo-text">
            <h1 className="header-logo-title">{title}</h1>
            <p className="header-logo-subtitle">{subtitle}</p>
          </div>
        </a>

        {/* 네비게이션 */}
        {navItems.length > 0 && (
          <nav className={`header-nav ${mobileMenuOpen ? 'mobile-visible' : ''}`}>
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={item.active ? 'active' : ''}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* 액션 버튼들 */}
        <div className="header-actions">
          {actions}
          {currentUser ? (
            <div className="header-user">
              <a href="/?page=auth" className="header-user-name">
                {currentUser.name}
              </a>
              <Button variant="secondary" size="sm" onClick={logout}>
                로그아웃
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.location.href = '/?page=auth';
              }}
            >
              로그인
            </Button>
          )}
        </div>

        {/* 모바일 메뉴 버튼 */}
        {navItems.length > 0 && (
          <button
            className="header-menu-btn"
            onClick={toggleMobileMenu}
            aria-label="메뉴 열기"
          >
            ☰
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
