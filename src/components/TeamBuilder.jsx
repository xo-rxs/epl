import { useMemo, useState } from 'react';
import Card from './Card';
import Button from './Button';
import { buildBalancedTeams } from '../utils/snakeDraft';
import '../styles/TeamBuilder.css';

/**
 * TeamBuilder 컴포넌트
 * 참가자 목록을 스네이크 드래프트로 두 팀으로 나눈다.
 */
function TeamBuilder({ participants = [], onConfirmTeams, confirmedAt }) {
  const [ageWeight, setAgeWeight] = useState(0.6);
  const [iterations, setIterations] = useState(30);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const normalizedParticipants = useMemo(() => {
    return participants.map((p) => ({
      ...p,
      skillScore: Number(p.skillScore || 3),
      age: Number(p.age || p.year || 20),
    }));
  }, [participants]);

  const result = useMemo(() => {
    if (normalizedParticipants.length < 2) return null;
    return buildBalancedTeams(normalizedParticipants, {
      yearWeight: ageWeight,
      iterations,
      seed: refreshSeed,
    });
  }, [normalizedParticipants, ageWeight, iterations, refreshSeed]);

  if (participants.length < 2) {
    return (
      <Card header={<h3 className="card-header-title">🤖 팀 빌딩</h3>}>
        <p className="team-builder-empty">최소 2명 이상 참가해야 팀 배정이 가능합니다.</p>
      </Card>
    );
  }

  return (
    <div className="team-builder-root">
      <Card header={<h3 className="card-header-title">🤖 Snake Draft 팀 빌딩</h3>}>
        <div className="team-builder-controls">
          <label className="team-builder-label">
            나이 가중치 ({Number(ageWeight).toFixed(1)})
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={ageWeight}
              onChange={(e) => setAgeWeight(Number(e.target.value))}
            />
          </label>

          <label className="team-builder-label">
            반복 횟수 ({iterations})
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
            />
          </label>

          <Button variant="primary" onClick={() => setRefreshSeed((v) => v + 1)}>
            재배정
          </Button>

          {result && onConfirmTeams && (
            <Button variant="secondary" onClick={() => onConfirmTeams(result)}>
              팀 구성 확정
            </Button>
          )}
        </div>

        {confirmedAt && (
          <p className="team-builder-empty">
            마지막 저장: {new Date(confirmedAt).toLocaleString('ko-KR')}
          </p>
        )}
      </Card>

      {result && (
        <>
          <Card header={<h3 className="card-header-title">📊 밸런스 지표</h3>}>
            <div className="team-builder-metrics">
              <div>총 밸런스 점수: <strong>{result.metrics.score.toFixed(2)}</strong></div>
              <div>실력 차이: <strong>{result.metrics.skillDiff.toFixed(2)}</strong></div>
              <div>나이 페널티: <strong>{result.metrics.yearPenalty.toFixed(2)}</strong></div>
              <div>팀 A 평균 나이: <strong>{result.metrics.avgYearA.toFixed(2)}</strong></div>
              <div>팀 B 평균 나이: <strong>{result.metrics.avgYearB.toFixed(2)}</strong></div>
            </div>
          </Card>

          <div className="team-builder-grid">
            <Card variant="team-a" header={<h3 className="card-header-title">🔵 팀 A ({result.teamA.length})</h3>}>
              <ul className="team-builder-list">
                {result.teamA.map((player) => (
                  <li key={player.id} className="team-builder-player">
                    <span>{player.name || player.nickname}</span>
                    <span className="team-builder-badge">{player.position}</span>
                    <span className="team-builder-badge">{player.age}세</span>
                    <span className="team-builder-badge">실력 {player.skillScore}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card variant="team-b" header={<h3 className="card-header-title">🔴 팀 B ({result.teamB.length})</h3>}>
              <ul className="team-builder-list">
                {result.teamB.map((player) => (
                  <li key={player.id} className="team-builder-player">
                    <span>{player.name || player.nickname}</span>
                    <span className="team-builder-badge">{player.position}</span>
                    <span className="team-builder-badge">{player.age}세</span>
                    <span className="team-builder-badge">실력 {player.skillScore}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default TeamBuilder;
