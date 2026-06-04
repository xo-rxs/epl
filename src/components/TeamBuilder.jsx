import { useMemo, useState } from 'react';
import Button from './Button';
import { buildBalancedTeams } from '../utils/snakeDraft';
import '../styles/TeamBuilder.css';

const POSITION_COLOR = {
  GK: { bg: '#fff3cd', color: '#856404' },
  DF: { bg: '#cfe2ff', color: '#084298' },
  MF: { bg: '#d1e7dd', color: '#0a3622' },
  FW: { bg: '#f8d7da', color: '#842029' },
};

const SkillDots = ({ score, max = 5 }) => (
  <div className="tb-skill-dots">
    {Array.from({ length: max }, (_, i) => (
      <span key={i} className={`tb-skill-dot ${i < score ? 'is-filled' : ''}`} />
    ))}
    <span className="tb-skill-num">{score}</span>
  </div>
);

const PlayerRow = ({ player, rank }) => {
  const posStyle = POSITION_COLOR[player.position] || { bg: '#e9ecef', color: '#495057' };
  return (
    <li className="tb-player-row">
      <span className="tb-player-rank">{rank}</span>
      <div className="tb-player-info">
        <span className="tb-player-name">{player.name || player.nickname}</span>
        <span className="tb-player-age">{player.age}세</span>
      </div>
      <span className="tb-position-badge" style={{ background: posStyle.bg, color: posStyle.color }}>
        {player.position}
      </span>
      <SkillDots score={player.skillScore} />
    </li>
  );
};

const StatCard = ({ label, value, sub, accent }) => (
  <div className="tb-stat-card">
    <span className="tb-stat-value" style={accent ? { color: accent } : {}}>{value}</span>
    <span className="tb-stat-label">{label}</span>
    {sub && <span className="tb-stat-sub">{sub}</span>}
  </div>
);

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
      <div className="tb-empty">
        <span>👥</span>
        <p>최소 2명 이상 참가해야 팀 배정이 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="team-builder-root">
      {/* 알고리즘 컨트롤 */}
      <div className="tb-control-card">
        <div className="tb-control-header">
          <div>
            <h3 className="tb-control-title">🤖 Snake Draft 팀 빌딩</h3>
            <p className="tb-control-desc">실력과 나이 균형을 맞춰 팀을 자동 배정합니다.</p>
          </div>
          <div className="tb-control-actions">
            <Button variant="primary" onClick={() => setRefreshSeed((v) => v + 1)}>
              🔄 재배정
            </Button>
            {result && onConfirmTeams && (
              <Button variant="secondary" onClick={() => onConfirmTeams(result)}>
                ✅ 팀 구성 확정
              </Button>
            )}
          </div>
        </div>

        <div className="tb-sliders">
          <div className="tb-slider-item">
            <div className="tb-slider-header">
              <span>나이 가중치</span>
              <span className="tb-slider-value">{Number(ageWeight).toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={ageWeight}
              onChange={(e) => setAgeWeight(Number(e.target.value))}
            />
            <div className="tb-slider-labels"><span>낮음</span><span>높음</span></div>
          </div>
          <div className="tb-slider-item">
            <div className="tb-slider-header">
              <span>최적화 반복</span>
              <span className="tb-slider-value">{iterations}회</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
            />
            <div className="tb-slider-labels"><span>빠름</span><span>정밀</span></div>
          </div>
        </div>

        {confirmedAt && (
          <p className="tb-saved-at">
            ✅ 마지막 저장: {new Date(confirmedAt).toLocaleString('ko-KR')}
          </p>
        )}
      </div>

      {result && (
        <>
          {/* 밸런스 지표 */}
          <div className="tb-metrics">
            <StatCard label="밸런스 점수" value={result.metrics.score.toFixed(2)} />
            <StatCard
              label="실력 차이"
              value={result.metrics.skillDiff.toFixed(2)}
              accent={result.metrics.skillDiff < 1 ? '#2ecc71' : result.metrics.skillDiff < 2 ? '#f39c12' : '#e74c3c'}
            />
            <StatCard label="팀 A 평균 나이" value={`${result.metrics.avgYearA.toFixed(1)}세`} />
            <StatCard label="팀 B 평균 나이" value={`${result.metrics.avgYearB.toFixed(1)}세`} />
            <StatCard label="나이 페널티" value={result.metrics.yearPenalty.toFixed(2)} />
          </div>

          {/* 팀 카드 */}
          <div className="team-builder-grid">
            <div className="tb-team-card tb-team-a">
              <div className="tb-team-header">
                <span className="tb-team-dot" style={{ background: '#3498db' }} />
                <h3>팀 A</h3>
                <span className="tb-team-count">{result.teamA.length}명</span>
                <span className="tb-team-avg">
                  평균 실력 {(result.teamA.reduce((s, p) => s + p.skillScore, 0) / result.teamA.length).toFixed(1)}
                </span>
              </div>
              <ul className="tb-player-list">
                {result.teamA.map((player, i) => (
                  <PlayerRow key={player.id} player={player} rank={i + 1} />
                ))}
              </ul>
            </div>

            <div className="tb-team-card tb-team-b">
              <div className="tb-team-header">
                <span className="tb-team-dot" style={{ background: '#e74c3c' }} />
                <h3>팀 B</h3>
                <span className="tb-team-count">{result.teamB.length}명</span>
                <span className="tb-team-avg">
                  평균 실력 {(result.teamB.reduce((s, p) => s + p.skillScore, 0) / result.teamB.length).toFixed(1)}
                </span>
              </div>
              <ul className="tb-player-list">
                {result.teamB.map((player, i) => (
                  <PlayerRow key={player.id} player={player} rank={i + 1} />
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TeamBuilder;
