import { useMemo, useState } from 'react';
import { Layout, Container, Card, TacticsBoard } from '../components';
import TeamBuilder from '../components/TeamBuilder';
import { useMatchData } from '../hooks';

/**
 * TeamPage 컴포넌트
 * 생성된 경기 중 하나를 선택해 팀 빌딩을 수행한다.
 */
function TeamPage() {
  const { matches, updateMatch } = useMatchData();
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');

  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  const approvedParticipants = useMemo(() => {
    if (!selectedMatch) return [];
    return (selectedMatch.participants || []).filter(
      (participant) => (participant.status || 'approved') === 'approved'
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

    alert('팀 구성이 저장되었습니다!');
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/', active: false },
      { label: '경기', href: '/?page=match' },
      { label: '팀 구성', href: '/?page=teams', active: true },
      { label: '평가', href: '/?page=reviews' },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-4)' }}>
          팀 구성
        </h2>

        {matches.length === 0 ? (
          <Card header={<h3 className="card-header-title">안내</h3>}>
            <p>먼저 경기와 참여자를 등록해주세요. 등록 후 팀 구성 기능을 사용할 수 있습니다.</p>
          </Card>
        ) : (
          <>
            <Card header={<h3 className="card-header-title">경기 선택</h3>}>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-base)',
                }}
              >
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.title} ({match.participants.length}/{match.maxParticipants})
                  </option>
                ))}
              </select>
            </Card>

            {selectedMatch && (
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                <TeamBuilder
                  participants={approvedParticipants}
                  onConfirmTeams={handleConfirmTeams}
                  confirmedAt={selectedMatch.teamAssignment?.savedAt}
                />
              </div>
            )}

            {selectedMatch && (
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                {selectedMatch.teamAssignment ? (
                  <TacticsBoard match={selectedMatch} />
                ) : (
                  <Card header={<h3 className="card-header-title">🧩 전술 배치도</h3>}>
                    <p>팀 구성을 확정하면 전술 배치도를 사용할 수 있습니다.</p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
}

export default TeamPage;
