import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from './Button';
import { buildBalancedTeams } from '../utils/snakeDraft';
import { exportToCSV, generateFilename } from '../utils/csvExport';
import '../styles/TeamBuilder.css';


const SkillDots = ({ score, max = 5 }) => (
  <div className="tb-skill-dots">
    {Array.from({ length: max }, (_, i) => (
      <span key={i} className={`tb-skill-dot ${i < score ? 'is-filled' : ''}`} />
    ))}
    <span className="tb-skill-num">{score}</span>
  </div>
);

// 일반 선수 행 (수동 모드 아닐 때)
const PlayerRow = ({ player, rank }) => (
  <li className="tb-player-row">
    <span className="tb-player-rank">{rank}</span>
    <div className="tb-player-info">
      <span className="tb-player-name">{player.name}</span>
      <span className="tb-player-age">{player.age}세</span>
    </div>
    <span className="tb-position-badge">{player.position}</span>
    <SkillDots score={player.skillScore} />
  </li>
);

// 드래그 가능한 선수 행 (수동 모드 — 팀 내 정렬 + 팀 간 이동)
const SortablePlayerRow = ({ player, rank }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`tb-player-row is-draggable${isDragging ? ' is-dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className="tb-drag-handle" aria-hidden="true">⠿</span>
      <span className="tb-player-rank">{rank}</span>
      <div className="tb-player-info">
        <span className="tb-player-name">{player.name}</span>
        <span className="tb-player-age">{player.age}세</span>
      </div>
      <span className="tb-position-badge">{player.position}</span>
      <SkillDots score={player.skillScore} />
    </li>
  );
};

// SortableContext + 드롭 존을 합친 팀 리스트
const SortableTeamList = ({ id, players }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <SortableContext items={players.map((p) => p.id)} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className={`tb-player-list${isOver ? ' is-drop-over' : ''}`}>
        {players.map((player, i) => (
          <SortablePlayerRow key={player.id} player={player} rank={i + 1} />
        ))}
      </ul>
    </SortableContext>
  );
};

const avgSkill = (players) =>
  players.length === 0
    ? 0
    : players.reduce((s, p) => s + p.skillScore, 0) / players.length;

const sortBySkill = (players) => [...players].sort((a, b) => b.skillScore - a.skillScore);

// active.id 가 속한 팀 키 반환
const findTeam = (id, teams) => {
  if (teams.teamA.some((p) => p.id === id)) return 'teamA';
  if (teams.teamB.some((p) => p.id === id)) return 'teamB';
  return null;
};

/**
 * TeamBuilder 컴포넌트
 * - 수동 모드: 팀 내 드래그로 순서 조정 + 팀 간 드래그로 선수 이동
 * - 팀 간 이동 시 양 팀 모두 실력순으로 자동 정렬
 */
function TeamBuilder({ participants = [], onConfirmTeams, confirmedAt, confirmedTeams }) {
  const [ageWeight, setAgeWeight] = useState(0.6);
  const [iterations, setIterations] = useState(30);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualTeams, setManualTeams] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);
  // 재배정 클릭 시 confirmedTeams 대신 새 자동 결과를 보여주기 위한 플래그
  const [useAutoResult, setUseAutoResult] = useState(false);

  // 드래그 시작 시 원래 팀을 기억해 두어 dragEnd에서 크로스팀 여부 판단
  const origTeamRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

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

  // useAutoResult=true면 confirmedTeams 무시하고 새 자동 결과 표시
  const displayTeams = isManualMode
    ? manualTeams
    : (useAutoResult || !confirmedTeams) ? result : confirmedTeams;

  const handleReassign = () => {
    setRefreshSeed((v) => v + 1);
    setUseAutoResult(true);
  };

  const handleEnterManualMode = () => {
    const source = (useAutoResult ? result : null) || confirmedTeams || result;
    if (!source) return;
    setManualTeams({ teamA: [...source.teamA], teamB: [...source.teamB] });
    setIsManualMode(true);
  };

  const handleSaveManual = () => {
    if (onConfirmTeams && manualTeams) onConfirmTeams(manualTeams);
    setIsManualMode(false);
    setManualTeams(null);
    setUseAutoResult(false);
  };

  const handleCancelManual = () => {
    setIsManualMode(false);
    setManualTeams(null);
  };

  const handleConfirmAuto = () => {
    if (onConfirmTeams && result) onConfirmTeams(result);
    setUseAutoResult(false);
  };

  // ── DnD 핸들러 ────────────────────────────────────────────────

  const handleDragStart = ({ active }) => {
    setManualTeams((prev) => {
      if (!prev) return prev;
      const player =
        prev.teamA.find((p) => p.id === active.id) ||
        prev.teamB.find((p) => p.id === active.id);
      if (player) setActivePlayer(player);
      origTeamRef.current = findTeam(active.id, prev);
      return prev;
    });
  };

  // 드래그 중 실시간 위치 반영 (같은 팀: 순서 재배열 / 다른 팀: 임시 이동)
  const handleDragOver = ({ active, over }) => {
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    setManualTeams((prev) => {
      if (!prev) return prev;

      const sourceTeam = findTeam(activeId, prev);
      if (!sourceTeam) return prev;

      const overIsContainer = overId === 'teamA' || overId === 'teamB';
      const targetTeam = overIsContainer
        ? overId
        : findTeam(overId, prev);
      if (!targetTeam) return prev;

      const newTeams = { teamA: [...prev.teamA], teamB: [...prev.teamB] };
      const oldIndex = newTeams[sourceTeam].findIndex((p) => p.id === activeId);
      if (oldIndex === -1) return prev;

      if (sourceTeam === targetTeam) {
        // 같은 팀 — 위치 교환
        const newIndex = overIsContainer
          ? newTeams[targetTeam].length - 1
          : newTeams[targetTeam].findIndex((p) => p.id === overId);
        if (newIndex === -1 || oldIndex === newIndex) return prev;
        newTeams[sourceTeam] = arrayMove(newTeams[sourceTeam], oldIndex, newIndex);
      } else {
        // 다른 팀 — 임시 이동
        const [player] = newTeams[sourceTeam].splice(oldIndex, 1);
        if (overIsContainer) {
          newTeams[targetTeam] = [...newTeams[targetTeam], player];
        } else {
          const insertAt = newTeams[targetTeam].findIndex((p) => p.id === overId);
          newTeams[targetTeam].splice(insertAt === -1 ? newTeams[targetTeam].length : insertAt, 0, player);
        }
      }

      return newTeams;
    });
  };

  // 드래그 종료 — 팀 간 이동이었으면 양 팀 실력순 정렬
  const handleDragEnd = ({ active }) => {
    setActivePlayer(null);
    const origTeam = origTeamRef.current;
    origTeamRef.current = null;

    setManualTeams((prev) => {
      if (!prev) return prev;
      const finalTeam = findTeam(active.id, prev);
      if (origTeam && finalTeam && origTeam !== finalTeam) {
        return {
          teamA: sortBySkill(prev.teamA),
          teamB: sortBySkill(prev.teamB),
        };
      }
      return prev;
    });
  };

  // ─────────────────────────────────────────────────────────────

  const handleExportTeamsCSV = () => {
    const source = displayTeams || result;
    if (!source) return;
    const toRows = (players, teamLabel) =>
      players.map((p, i) => ({
        '팀': teamLabel,
        '순서': i + 1,
        '이름': p.name,
        '나이': p.age || '',
        '포지션': p.position || '',
        '실력점수': p.skillScore || '',
      }));
    exportToCSV(
      [...toRows(source.teamA, 'A (블루)'), ...toRows(source.teamB, 'B (레드)')],
      generateFilename('팀배정')
    );
  };

  if (participants.length < 2) {
    return (
      <div className="tb-empty">
        <p>최소 2명 이상 참가해야 팀 배정이 가능합니다.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="team-builder-root">
        {/* 수동 조정 배너 */}
        {isManualMode && (
          <div className="tb-manual-banner">
            <span className="tb-manual-banner-text">
              수동 조정 중 — 팀 내 드래그로 순서 조정 / 반대 팀으로 드래그하면 실력순 자동 정렬
            </span>
            <div className="tb-manual-banner-actions">
              <Button variant="primary" size="sm" onClick={handleSaveManual}>
                조정 저장
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCancelManual}>
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 알고리즘 컨트롤 */}
        {!isManualMode && (
          <div className="tb-control-card">
            <div className="tb-control-header">
              <div>
                <h3 className="tb-control-title">Snake Draft 팀 빌딩</h3>
                <p className="tb-control-desc">실력과 나이 균형을 맞춰 팀을 자동 배정합니다.</p>
              </div>
              <div className="tb-control-actions">
                <Button variant="primary" onClick={handleReassign}>
                  재배정
                </Button>
                {displayTeams && (
                  <Button variant="secondary" onClick={handleEnterManualMode}>
                    수동 조정
                  </Button>
                )}
                {result && onConfirmTeams && (useAutoResult || !confirmedTeams) && (
                  <Button variant="secondary" onClick={handleConfirmAuto}>
                    팀 구성 확정
                  </Button>
                )}
                {displayTeams && (
                  <Button variant="secondary" onClick={handleExportTeamsCSV}>
                    CSV 내보내기
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
                  type="range" min="0" max="2" step="0.1" value={ageWeight}
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
                  type="range" min="10" max="100" step="5" value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                />
                <div className="tb-slider-labels"><span>빠름</span><span>정밀</span></div>
              </div>
            </div>

            {confirmedAt && (
              <p className="tb-saved-at">
                마지막 저장: {new Date(confirmedAt).toLocaleString('ko-KR')}
              </p>
            )}
          </div>
        )}

        {/* 확정 배너 — 재배정 중엔 숨김 */}
        {!isManualMode && confirmedTeams && !useAutoResult && (
          <div className="tb-confirmed-banner">
            팀 구성이 확정되었습니다. 재배정하거나 수동 조정 후 다시 저장할 수 있습니다.
          </div>
        )}

        {/* 팀 카드 */}
        {displayTeams && (
          <div className="team-builder-grid">
            {/* 팀 A */}
            <div className={`tb-team-card tb-team-a ${isManualMode ? 'is-manual' : ''}`}>
              <div className="tb-team-header">
                <h3>팀 A</h3>
                <span className="tb-team-count">{displayTeams.teamA.length}명</span>
                <span className="tb-team-avg">
                  평균 실력 {avgSkill(displayTeams.teamA).toFixed(1)}
                </span>
              </div>
              {isManualMode ? (
                <SortableTeamList id="teamA" players={displayTeams.teamA} />
              ) : (
                <ul className="tb-player-list">
                  {displayTeams.teamA.map((player, i) => (
                    <PlayerRow key={player.id} player={player} rank={i + 1} />
                  ))}
                </ul>
              )}
            </div>

            {/* 팀 B */}
            <div className={`tb-team-card tb-team-b ${isManualMode ? 'is-manual' : ''}`}>
              <div className="tb-team-header">
                <h3>팀 B</h3>
                <span className="tb-team-count">{displayTeams.teamB.length}명</span>
                <span className="tb-team-avg">
                  평균 실력 {avgSkill(displayTeams.teamB).toFixed(1)}
                </span>
              </div>
              {isManualMode ? (
                <SortableTeamList id="teamB" players={displayTeams.teamB} />
              ) : (
                <ul className="tb-player-list">
                  {displayTeams.teamB.map((player, i) => (
                    <PlayerRow key={player.id} player={player} rank={i + 1} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 드래그 중 플레이어 미리보기 */}
        <DragOverlay>
          {activePlayer && (
            <div className="tb-drag-overlay">
              <span className="tb-drag-overlay-name">{activePlayer.name}</span>
              <span className="tb-position-badge">{activePlayer.position}</span>
              <SkillDots score={activePlayer.skillScore} />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default TeamBuilder;
