import './styles/globals.css';
import './styles/Home.css';
import { useState, useEffect } from 'react';
import { Layout, Button } from './components';
import MatchPage from './pages/MatchPage';
import TeamPage from './pages/TeamPage';
import ReviewPage from './pages/ReviewPage';
import AuthPage from './pages/AuthPage';
import SchedulePage from './pages/SchedulePage';

// URL의 ?page= 값과 실제로 보여줄 페이지 컴포넌트를 짝지어 둔 표.
// 새 페이지를 추가할 때는 여기에 한 줄만 넣으면 됩니다.
const PAGE_COMPONENTS = {
  match: MatchPage,
  teams: TeamPage,
  reviews: ReviewPage,
  schedule: SchedulePage,
  auth: AuthPage,
};

/**
 * 현재 주소(URL)를 보고 어떤 페이지를 보여줄지 이름으로 돌려준다.
 * 예) /?page=teams  -> 'teams'
 *     /?matchId=123 -> 'match' (경기 상세)
 *     그 외          -> 'home'
 */
const getPageFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page');

  // matchId가 있으면 특정 경기 상세 화면(match)으로 본다.
  if (params.has('matchId')) return 'match';

  // page 값이 표에 있는 정식 페이지면 그대로, 아니면 홈으로.
  return PAGE_COMPONENTS[page] ? page : 'home';
};

/**
 * App 메인 컴포넌트
 * EPL 홈페이지 및 라우팅 관리
 */
function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // URL 기반 페이지 라우팅 및 브라우저 뒤로가기 동기화
  useEffect(() => {
    const syncPageFromUrl = () => setCurrentPage(getPageFromUrl());

    syncPageFromUrl();
    window.addEventListener('popstate', syncPageFromUrl);
    return () => window.removeEventListener('popstate', syncPageFromUrl);
  }, []);

  const navigateTo = (page, url) => {
    setCurrentPage(page);
    window.history.pushState(null, '', url);
  };

  // 홈페이지
  const renderHome = () => {
    const navItems = [
      { label: '홈', href: '/', active: true },
      { label: '경기', href: '/?page=match' },
      { label: '일정', href: '/?page=schedule' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
      { label: '마이페이지', href: '/?page=auth' },
    ];

    const headerActions = (
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigateTo('match', '/?page=match')}
      >
        시작하기
      </Button>
    );

    const headerProps = {
      title: 'EPL',
      subtitle: 'Easy Pick League',
      logo: '⚽',
      navItems,
      actions: headerActions,
    };

    const features = [
      {
        icon: '매치',
        title: '매치 모집',
        desc: '경기 정보를 입력하면 참여 폼이 자동 생성됩니다. 링크 공유만으로 실시간 참여 현황을 확인하세요.',
        color: '#2ecc71',
        page: 'match',
        url: '/?page=match',
      },
      {
        icon: '팀배정',
        title: '자동 팀 배정',
        desc: 'Snake Draft 알고리즘이 실력·학년을 균형 있게 고려해 공정한 팀을 자동으로 구성합니다.',
        color: '#3498db',
        page: 'teams',
        url: '/?page=teams',
      },
      {
        icon: '전술',
        title: '전술 배치도',
        desc: '팀원 아이콘을 드래그해 포지션을 배치하고, PNG 이미지로 저장해 바로 공유하세요.',
        color: '#9b59b6',
        page: 'teams',
        url: '/?page=teams',
      },
      {
        icon: '리뷰',
        title: '별점 리뷰',
        desc: '경기 후 상호 평가로 신뢰도 기반 커뮤니티를 만들어 갑니다. 레이더 차트로 성장을 확인하세요.',
        color: '#f39c12',
        page: 'reviews',
        url: '/?page=reviews',
      },
    ];

    const stats = [
      { value: '80%', label: '인원 관리 시간 단축' },
      { value: '공정', label: '알고리즘 팀 배정' },
      { value: '즉시', label: '링크 공유 참여 취합' },
    ];

    return (
      <Layout headerProps={headerProps}>
        {/* 히어로 섹션 */}
        <section className="home-hero">
          <div className="home-hero__badge">Easy Pick League</div>
          <h1 className="home-hero__title">
            아마추어 축구,<br />
            <span className="home-hero__accent">스마트하게</span> 운영하세요
          </h1>
          <p className="home-hero__desc">
            총무의 인원 관리 시간을 80% 줄여주는 자동화 플랫폼.<br />
            참여 취합부터 팀 배정, 전술도, 별점 리뷰까지 한 번에.
          </p>
          <div className="home-hero__actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigateTo('match', '/?page=match')}
            >
              경기 만들기
            </Button>
            <button
              className="home-hero__ghost-btn"
              onClick={() => navigateTo('teams', '/?page=teams')}
            >
              팀 배정 보기 →
            </button>
          </div>

          {/* 통계 배지 */}
          <div className="home-stats">
            {stats.map((s) => (
              <div key={s.label} className="home-stats__item">
                <span className="home-stats__value">{s.value}</span>
                <span className="home-stats__label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 기능 카드 섹션 */}
        <section className="home-features">
          <div className="home-features__header">
            <h2 className="home-features__title">주요 기능</h2>
            <p className="home-features__subtitle">필요한 모든 것을 하나의 플랫폼에서</p>
          </div>
          <div className="home-features__grid">
            {features.map((f) => (
              <button
                key={f.title}
                className="home-feature-card"
                onClick={() => navigateTo(f.page, f.url)}
              >
                <div className="home-feature-card__icon" style={{ background: f.color + '18', color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="home-feature-card__title">{f.title}</h3>
                <p className="home-feature-card__desc">{f.desc}</p>
                <span className="home-feature-card__cta" style={{ color: f.color }}>
                  바로가기 →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="home-cta">
          <h2 className="home-cta__title">지금 바로 시작해보세요</h2>
          <p className="home-cta__desc">설치 없이. 링크 하나로 모든 팀원이 참여합니다.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigateTo('match', '/?page=match')}
          >
            무료로 경기 만들기
          </Button>
        </section>
      </Layout>
    );
  };

  // 현재 페이지에 해당하는 컴포넌트를 표에서 찾아 보여준다.
  // 표에 없으면(=home) 아래의 홈 화면을 그린다.
  const PageComponent = PAGE_COMPONENTS[currentPage];
  if (PageComponent) return <PageComponent />;

  return renderHome();
}

export default App;
