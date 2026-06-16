import { useMemo, useState } from 'react';
import { Layout, Container, Button } from '../components';
import { useAuthData, useMatchData } from '../hooks';
import { getMatchBadge } from '../utils/matchStatus';
import '../styles/SchedulePage.css';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 'YYYY-MM-DD' 형태의 로컬 날짜 키 생성 (시간대 보정)
const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 참여 상태 추출 (status 미지정 시 approved로 간주)
const getStatus = (participant) => participant.status || 'approved';

/**
 * SchedulePage 컴포넌트
 * 로그인 사용자가 참여한 경기를 월 캘린더로 보여주는 일정 확인 페이지
 */
function SchedulePage() {
  const { matches } = useMatchData();
  const { currentUser } = useAuthData();

  // 현재 보고 있는 달 (해당 월 1일 기준)
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  // 내가 참여 승인된 경기만 필터링
  const myMatches = useMemo(() => {
    if (!currentUser) return [];

    return matches.filter((match) =>
      (match.participants || []).some(
        (participant) =>
          participant.userId === currentUser.id &&
          getStatus(participant) === 'approved'
      )
    );
  }, [matches, currentUser]);

  // 날짜키 → 해당 날짜의 경기 목록 맵
  const matchesByDate = useMemo(() => {
    const map = {};

    myMatches.forEach((match) => {
      if (!match.datetime) return;
      const dateKey = toDateKey(new Date(match.datetime));
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(match);
    });

    // 같은 날 내에서는 시간순 정렬
    Object.values(map).forEach((list) =>
      list.sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    );

    return map;
  }, [myMatches]);

  // 캘린더 그리드 구성 (앞뒤 빈칸 포함한 날짜 셀 배열)
  const calendarCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    // 첫 주 앞쪽 빈칸
    for (let i = 0; i < firstDay; i += 1) {
      cells.push(null);
    }

    // 이번 달 날짜
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    return cells;
  }, [viewMonth]);

  const todayKey = toDateKey(new Date());
  const selectedMatches = matchesByDate[selectedDateKey] || [];

  const goPrevMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goThisMonth = () => {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateKey(toDateKey(now));
  };

  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/' },
      { label: '경기', href: '/?page=match' },
      { label: '일정', href: '/?page=schedule', active: true },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
      { label: '마이페이지', href: '/?page=auth' },
    ],
  };

  // 비로그인 안내 화면
  if (!currentUser) {
    return (
      <Layout headerProps={headerProps}>
        <Container>
          <div className="schedule-empty">
            <h2 className="schedule-empty__title">로그인이 필요합니다</h2>
            <p className="schedule-empty__desc">
              내가 참여한 경기 일정을 확인하려면 먼저 로그인해주세요.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                window.location.href = '/?page=auth';
              }}
            >
              로그인하기
            </Button>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <Container>
        <div className="schedule-page">
          {/* 페이지 헤더 */}
          <div className="schedule-header">
            <div>
              <h2 className="schedule-header__title">내 일정</h2>
              <p className="schedule-header__subtitle">
                참여 확정된 경기를 달력에서 한눈에 확인하세요.
              </p>
            </div>
            <span className="schedule-header__count">
              참여 경기 {myMatches.length}개
            </span>
          </div>

          {/* 월 이동 컨트롤 */}
          <div className="schedule-toolbar">
            <button
              type="button"
              className="schedule-nav-btn"
              onClick={goPrevMonth}
              aria-label="이전 달"
            >
              ‹
            </button>
            <span className="schedule-toolbar__month">{monthLabel}</span>
            <button
              type="button"
              className="schedule-nav-btn"
              onClick={goNextMonth}
              aria-label="다음 달"
            >
              ›
            </button>
            <button type="button" className="schedule-today-btn" onClick={goThisMonth}>
              오늘
            </button>
          </div>

          {/* 캘린더 */}
          <div className="schedule-calendar">
            <div className="schedule-weekdays">
              {WEEKDAY_LABELS.map((label, index) => (
                <div
                  key={label}
                  className={[
                    'schedule-weekday',
                    index === 0 && 'is-sunday',
                    index === 6 && 'is-saturday',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="schedule-grid">
              {calendarCells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="schedule-cell is-empty" />;
                }

                const dateKey = toDateKey(date);
                const dayMatches = matchesByDate[dateKey] || [];
                const weekday = date.getDay();

                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={[
                      'schedule-cell',
                      dateKey === todayKey && 'is-today',
                      dateKey === selectedDateKey && 'is-selected',
                      dayMatches.length > 0 && 'has-match',
                      weekday === 0 && 'is-sunday',
                      weekday === 6 && 'is-saturday',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelectedDateKey(dateKey)}
                  >
                    <span className="schedule-cell__day">{date.getDate()}</span>
                    {dayMatches.length > 0 && (
                      <span className="schedule-cell__badge">{dayMatches.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택한 날짜의 경기 목록 */}
          <div className="schedule-detail">
            <h3 className="schedule-detail__title">
              {new Date(selectedDateKey).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}{' '}
              경기
            </h3>

            {selectedMatches.length > 0 ? (
              <div className="schedule-match-list">
                {selectedMatches.map((match) => (
                  <a
                    key={match.id}
                    href={`/?page=match&matchId=${match.id}`}
                    className="schedule-match-card"
                  >
                    <div className="schedule-match-card__time">
                      {new Date(match.datetime).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="schedule-match-card__body">
                      <h4 className="schedule-match-card__title">{match.title}</h4>
                      <p className="schedule-match-card__meta">
                        {match.location} · {(match.participants || []).length}/
                        {match.maxParticipants}
                      </p>
                    </div>
                    <span
                      className="schedule-match-card__status"
                      style={{
                        backgroundColor: getMatchBadge(match).color,
                        color: 'var(--color-white)',
                      }}
                    >
                      {getMatchBadge(match).label}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="schedule-detail__empty">이 날짜에 참여한 경기가 없습니다.</p>
            )}
          </div>
        </div>
      </Container>
    </Layout>
  );
}

export default SchedulePage;
