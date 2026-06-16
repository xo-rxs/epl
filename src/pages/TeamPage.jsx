import { useMemo, useState } from 'react';
import { Layout, Container, TacticsBoard } from '../components';
import TeamBuilder from '../components/TeamBuilder';
import { useMatchData } from '../hooks';
import '../styles/TeamPage.css';

/**
 * TeamPage 컴포넌트
 * 생성된 경기 중 하나를 선택해 팀 빌딩을 수행한다.
 */
function TeamPage() {
  const { matches, updateMatch } = useMatchData();
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [savedMsg, setSavedMsg] = useState('');

  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  const approvedParticipants = useMemo(() => {
    if (!selectedMatch) return [];
    return (selectedMatch.participants || []).filter(
      (p) => (p.status || 'approved') === 'approved'
    );
  }, [selectedMatch]);

  const handleConfirmTeams = (result) => {
    if (!selectedMatch) return;

    updateMatch(selectedMatch.id, {
      teamAssignment: {
        teamA: result.teamA,
        teamB: result.teamB,
        metrics: result.metrics,
        savedAt: new Date().toISOString(),
      },
    });

    setSavedMsg('팀 구성이 저장되었습니다.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/' },
      { label: '경기', href: '/?page=match' },
      { label: '일정', href: '/?page=schedule' },
      { label: '팀 구성', href: '/?page=teams', active: true },
      { label: '평가', href: '/?page=reviews' },
      { label: '마이페이지', href: '/?page=auth' },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container>
        {/* 페이지 헤더 */}
        <div className="team-page-header">
          <div>
            <h2 className="team-page-title">팀 구성</h2>
            <p className="team-page-desc">Snake Draft 알고리즘으로 균형 잡힌 팀을 자동 배정합니다.</p>
          </div>
        </div>

        {savedMsg && (
          <div className="team-page-toast">{savedMsg}</div>
        )}

        {matches.length === 0 ? (
          <div className="team-page-empty">
            <p>먼저 경기와 참여자를 등록해주세요.</p>
            <a href="/?page=match">경기 만들러 가기 →</a>
          </div>
        ) : (
          <div className="team-page-body">
            {/* 경기 선택 */}
            <div className="team-page-match-select">
              <label className="team-page-select-label">경기 선택</label>
              <div className="team-page-select-wrap">
                <select
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  className="team-page-select"
                >
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.title} ({match.participants.length}/{match.maxParticipants})
                    </option>
                  ))}
                </select>
                <span className="team-page-select-icon">▾</span>
              </div>
              {selectedMatch && (
                <div className="team-page-match-meta">
                  <span>장소 · {selectedMatch.location}</span>
                  <span>{approvedParticipants.length}명 참가</span>
                  {selectedMatch.teamAssignment && (
                    <span className="team-page-match-badge">팀 확정됨</span>
                  )}
                </div>
              )}
            </div>

            {/* 팀 빌더 */}
            {selectedMatch && (
              <TeamBuilder
                participants={approvedParticipants}
                onConfirmTeams={handleConfirmTeams}
                confirmedAt={selectedMatch.teamAssignment?.savedAt}
              />
            )}

            {/* 전술 배치도 */}
            {selectedMatch && (
              selectedMatch.teamAssignment ? (
                <TacticsBoard match={selectedMatch} />
              ) : (
                <div className="team-page-tactics-locked">
                  <p>팀 구성을 확정하면 전술 배치도를 사용할 수 있습니다.</p>
                </div>
              )
            )}
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default TeamPage;
