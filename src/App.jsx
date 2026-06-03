import './styles/globals.css';
import { useState, useEffect } from 'react';
import { Layout, Container, Card, Button } from './components';
import MatchPage from './pages/MatchPage';
import TeamPage from './pages/TeamPage';
import ReviewPage from './pages/ReviewPage';
import AuthPage from './pages/AuthPage';

/**
 * App 메인 컴포넌트
 * EPL 홈페이지 및 라우팅 관리
 */
function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // URL 기반 페이지 라우팅 및 브라우저 뒤로가기 동기화
  useEffect(() => {
    const syncPageFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');

      if (page === 'teams') {
        setCurrentPage('teams');
        return;
      }

      if (page === 'reviews') {
        setCurrentPage('reviews');
        return;
      }

      if (page === 'auth') {
        setCurrentPage('auth');
        return;
      }

      if (params.has('matchId') || page === 'match') {
        setCurrentPage('match');
        return;
      }

      setCurrentPage('home');
    };

    syncPageFromUrl();
    window.addEventListener('popstate', syncPageFromUrl);

    return () => {
      window.removeEventListener('popstate', syncPageFromUrl);
    };
  }, []);

  // 홈페이지
  const renderHome = () => {
    const navItems = [
      { label: '홈', href: '/', active: true },
      { label: '경기', href: '/?page=match' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
    ];

    const headerActions = (
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          setCurrentPage('match');
          window.history.pushState(null, '', '/?page=match');
        }}
      >
        지금 시작하기
      </Button>
    );

    const headerProps = {
      title: 'EPL',
      subtitle: 'Easy Pick League',
      logo: '⚽',
      navItems,
      actions: headerActions,
    };

    return (
      <Layout headerProps={headerProps}>
        {/* 헤로 섹션 */}
        <section style={{ marginBottom: 'var(--spacing-12)', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--spacing-4)' }}>
            축구 경기를 더 똑똑하게 관리하세요
          </h1>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-6)' }}>
            자동 팀 배정, 시각적 전술도, 신뢰도 기반 평가 시스템으로
            <br />
            공정하고 투명한 경기 운영을 경험하세요.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setCurrentPage('match');
              window.history.pushState(null, '', '/?page=match');
            }}
          >
            지금 시작하기
          </Button>
        </section>

        <Container size="sm">
          {/* 기능 카드 */}
          <section style={{ marginBottom: 'var(--spacing-12)' }}>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-6)', textAlign: 'center' }}>
              주요 기능
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              <Card header={<h3 className="card-header-title">📝 매치 모집</h3>}>
                <p>경기 정보를 입력하고 참여자를 실시간으로 수집합니다.</p>
              </Card>

              <Card variant="primary" header={<h3 className="card-header-title">🤖 자동 팀 배정</h3>}>
                <p>실력과 학년을 고려한 공정한 팀 배분 알고리즘입니다.</p>
              </Card>

              <Card header={<h3 className="card-header-title">🎯 전술 배치도</h3>}>
                <p>드래그로 포지션을 배치하고 이미지로 저장하세요.</p>
              </Card>

              <Card header={<h3 className="card-header-title">⭐ 별점 평가</h3>}>
                <p>경기 후 상호 평가로 신뢰도 높은 커뮤니티를 만듭니다.</p>
              </Card>
            </div>
          </section>
        </Container>

        {/* 팀 구성 미리보기 */}
        <section
          style={{
            backgroundColor: 'var(--color-gray-50)',
            padding: 'var(--spacing-12)',
            marginTop: 'var(--spacing-12)',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
          }}
        >
          <Container>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-6)', textAlign: 'center' }}>
              팀 배정 미리보기
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)' }}>
              <Card variant="team-a" header={<h3 className="card-header-title">🔵 팀 A</h3>}>
                <ul style={{ paddingLeft: 'var(--spacing-4)' }}>
                  <li>선수 1 (FW)</li>
                  <li>선수 2 (MF)</li>
                  <li>선수 3 (DF)</li>
                </ul>
              </Card>
              <Card variant="team-b" header={<h3 className="card-header-title">🔴 팀 B</h3>}>
                <ul style={{ paddingLeft: 'var(--spacing-4)' }}>
                  <li>선수 4 (FW)</li>
                  <li>선수 5 (MF)</li>
                  <li>선수 6 (DF)</li>
                </ul>
              </Card>
            </div>
          </Container>
        </section>
      </Layout>
    );
  };

  // 경기 페이지
  const renderMatch = () => {
    return <MatchPage />;
  };

  // 팀 구성 페이지
  const renderTeams = () => {
    return <TeamPage />;
  };

  const renderReviews = () => {
    return <ReviewPage />;
  };

  const renderAuth = () => {
    return <AuthPage />;
  };

  // 페이지 렌더링
  if (currentPage === 'teams') {
    return renderTeams();
  }

  if (currentPage === 'match') {
    return renderMatch();
  }

  if (currentPage === 'reviews') {
    return renderReviews();
  }

  if (currentPage === 'auth') {
    return renderAuth();
  }

  return renderHome();
}

export default App;
