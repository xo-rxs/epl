import '../styles/Layout.css';
import Header from './Header';

/**
 * Layout 컴포넌트
 * 전체 페이지 레이아웃 (헤더, 메인, 푸터)
 * @param {ReactNode} header - 헤더 컴포넌트
 * @param {ReactNode} children - 메인 컨텐츠
 * @param {ReactNode} footer - 푸터 컨텐츠
 */
function Layout({
  headerProps = {},
  children,
  footer = true,
}) {
  return (
    <div className="layout">
      {/* 헤더 */}
      <div className="layout-header">
        <Header {...headerProps} />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="layout-main">
        <div className="layout-content">
          {children}
        </div>
      </main>

      {/* 푸터 */}
      {footer && (
        <footer className="layout-footer">
          <div className="container">
            <p style={{ textAlign: 'center', margin: 0 }}>
              © 2026 EPL (Easy Pick League). All rights reserved.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default Layout;
