import { useMemo, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import Card from './Card';
import Button from './Button';
import SoccerField from './SoccerField';
import PlayerDraggable from './PlayerDraggable';
import { downloadElementAsPng, shareElementImage } from '../utils/imageExport';
import '../styles/TacticsBoard.css';

const FIELD_POSITIONS = [
  { id: 'GK', label: 'GK', x: 10, y: 50 },
  { id: 'LB', label: 'LB', x: 22, y: 18 },
  { id: 'LCB', label: 'LCB', x: 22, y: 38 },
  { id: 'RCB', label: 'RCB', x: 22, y: 62 },
  { id: 'RB', label: 'RB', x: 22, y: 82 },
  { id: 'LCM', label: 'LCM', x: 40, y: 28 },
  { id: 'CM', label: 'CM', x: 42, y: 50 },
  { id: 'RCM', label: 'RCM', x: 40, y: 72 },
  { id: 'LW', label: 'LW', x: 60, y: 20 },
  { id: 'ST', label: 'ST', x: 64, y: 50 },
  { id: 'RW', label: 'RW', x: 60, y: 80 },
];

const mirrorX = (x) => 100 - x;

const buildFieldSlots = (teamId, positions) =>
  positions.map((slot) => ({
    id: `${teamId}_${slot.id}`,
    label: slot.label,
    team: teamId,
    type: 'field',
    x: teamId === 'A' ? slot.x : mirrorX(slot.x),
    y: slot.y,
  }));

const buildBenchSlots = (teamId, count) =>
  Array.from({ length: count }).map((_, index) => ({
    id: `${teamId}_BENCH_${index + 1}`,
    label: `BENCH ${index + 1}`,
    team: teamId,
    type: 'bench',
  }));

const getAverageSkill = (players) => {
  if (!players || players.length === 0) return 0;
  const total = players.reduce((sum, player) => sum + Number(player.skillScore || 0), 0);
  return total / players.length;
};

const buildInitialAssignments = (teams, slotsByTeam) => {
  const assignments = {};

  Object.entries(teams).forEach(([teamId, players]) => {
    const slotIds = slotsByTeam[teamId].map((slot) => slot.id);
    players.forEach((player, index) => {
      assignments[player.id] = slotIds[index] || slotIds[slotIds.length - 1];
    });
  });

  return assignments;
};

const createFilenamePrefix = (title) => {
  if (!title) return 'tactics_board';
  return title
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();
};

const dropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.2',
      },
    },
  }),
};

function PositionSlot({ slot, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  const slotClassName = [
    'tactics-board-slot',
    slot.type === 'bench' && 'tactics-board-slot-bench',
    isOver && 'is-over',
    slot.team === 'A' ? 'team-a' : 'team-b',
  ]
    .filter(Boolean)
    .join(' ');

  const style =
    slot.type === 'field'
      ? {
          left: `${slot.x}%`,
          top: `${slot.y}%`,
        }
      : undefined;

  return (
    <div ref={setNodeRef} className={slotClassName} style={style}>
      <div className="tactics-board-slot-label">{slot.label}</div>
      <div className="tactics-board-slot-content">{children}</div>
    </div>
  );
}

function TacticsBoard({ match }) {
  const boardRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewTeam, setViewTeam] = useState('A');

  const teamAssignment = match?.teamAssignment;
  const teamA = teamAssignment?.teamA || [];
  const teamB = teamAssignment?.teamB || [];

  const benchSizeA = Math.max(4, teamA.length - FIELD_POSITIONS.length);
  const benchSizeB = Math.max(4, teamB.length - FIELD_POSITIONS.length);

  const fieldSlotsA = useMemo(() => buildFieldSlots('A', FIELD_POSITIONS), []);
  const fieldSlotsB = useMemo(() => buildFieldSlots('B', FIELD_POSITIONS), []);

  const benchSlotsA = useMemo(() => buildBenchSlots('A', benchSizeA), [benchSizeA]);
  const benchSlotsB = useMemo(() => buildBenchSlots('B', benchSizeB), [benchSizeB]);

  const slotsByTeam = useMemo(
    () => ({
      A: [...fieldSlotsA, ...benchSlotsA],
      B: [...fieldSlotsB, ...benchSlotsB],
    }),
    [benchSlotsA, benchSlotsB, fieldSlotsA, fieldSlotsB]
  );

  const allSlots = useMemo(
    () => [...fieldSlotsA, ...fieldSlotsB, ...benchSlotsA, ...benchSlotsB],
    [benchSlotsA, benchSlotsB, fieldSlotsA, fieldSlotsB]
  );

  const slotById = useMemo(() => {
    return allSlots.reduce((acc, slot) => {
      acc[slot.id] = slot;
      return acc;
    }, {});
  }, [allSlots]);

  const players = useMemo(() => [...teamA, ...teamB], [teamA, teamB]);

  const playerById = useMemo(() => {
    return players.reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }, [players]);

  const playerTeamMap = useMemo(() => {
    const map = {};
    teamA.forEach((player) => {
      map[player.id] = 'A';
    });
    teamB.forEach((player) => {
      map[player.id] = 'B';
    });
    return map;
  }, [teamA, teamB]);

  const [playerSlots, setPlayerSlots] = useState(() =>
    buildInitialAssignments({ A: teamA, B: teamB }, slotsByTeam)
  );

  useEffect(() => {
    setPlayerSlots(buildInitialAssignments({ A: teamA, B: teamB }, slotsByTeam));
  }, [teamA, teamB, slotsByTeam]);

  const slotToPlayer = useMemo(() => {
    return Object.entries(playerSlots).reduce((acc, [playerId, slotId]) => {
      acc[slotId] = playerId;
      return acc;
    }, {});
  }, [playerSlots]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  );

  const activePlayer = activeId ? playerById[activeId] : null;
  const visibleFieldSlots = viewTeam === 'A' ? fieldSlotsA : fieldSlotsB;
  const visibleBenchSlots = viewTeam === 'A' ? benchSlotsA : benchSlotsB;
  const visibleTeamLabel = viewTeam === 'A' ? '팀 A' : '팀 B';

  const handleDragStart = (event) => {
    setActiveId(event.active?.id || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activePlayerId = active.id;
    const targetSlotId = over.id;
    const targetSlot = slotById[targetSlotId];

    if (!targetSlot) return;

    const playerTeam = playerTeamMap[activePlayerId];
    if (targetSlot.team !== playerTeam) return;

    setPlayerSlots((prev) => {
      const next = { ...prev };
      const previousSlotId = prev[activePlayerId];
      const occupiedPlayerId = Object.entries(prev).find(([, slotId]) => slotId === targetSlotId)?.[0];

      next[activePlayerId] = targetSlotId;

      if (occupiedPlayerId && occupiedPlayerId !== activePlayerId) {
        next[occupiedPlayerId] = previousSlotId;
      }

      return next;
    });
  };

  const handleDownload = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    try {
      const filename = `${createFilenamePrefix(match?.title || 'tactics')}_board.png`;
      await downloadElementAsPng(boardRef.current, filename, { scale: 2, backgroundColor: '#0b5d2a' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    try {
      const success = await shareElementImage(boardRef.current, {
        title: match?.title || '전술 배치도',
        text: '전술 배치도 공유',
        filename: `${createFilenamePrefix(match?.title || 'tactics')}_board.png`,
        options: { scale: 2, backgroundColor: '#0b5d2a' },
      });

      if (!success) {
        await handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!teamAssignment) {
    return null;
  }

  return (
    <Card header={<h3 className="card-header-title">🧩 전술 배치도</h3>}>
      <div className="tactics-board">
        <div className="tactics-board-meta">
          <div>
            <strong>팀 A 평균 실력:</strong> {getAverageSkill(teamA).toFixed(1)}
          </div>
          <div>
            <strong>팀 B 평균 실력:</strong> {getAverageSkill(teamB).toFixed(1)}
          </div>
          {teamAssignment.savedAt && (
            <div className="tactics-board-saved">
              저장: {new Date(teamAssignment.savedAt).toLocaleString('ko-KR')}
            </div>
          )}
        </div>

        <div className="tactics-board-toggle" role="tablist" aria-label="팀 선택">
          <button
            type="button"
            className={[
              'tactics-board-toggle-button',
              'team-a',
              viewTeam === 'A' && 'is-active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setViewTeam('A')}
            aria-pressed={viewTeam === 'A'}
          >
            블루 팀 보기
          </button>
          <button
            type="button"
            className={[
              'tactics-board-toggle-button',
              'team-b',
              viewTeam === 'B' && 'is-active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setViewTeam('B')}
            aria-pressed={viewTeam === 'B'}
          >
            레드 팀 보기
          </button>
        </div>

        <div className="tactics-board-canvas" ref={boardRef}>
          <div className="tactics-board-caption">
            <div className="tactics-board-title">{match?.title || '전술 배치도'}</div>
            <div className="tactics-board-subtitle">드래그로 포지션을 조정하세요.</div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SoccerField>
              {visibleFieldSlots.map((slot) => (
                <PositionSlot key={slot.id} slot={slot}>
                  {slotToPlayer[slot.id] && (
                    <PlayerDraggable
                      player={playerById[slotToPlayer[slot.id]]}
                      team={viewTeam}
                    />
                  )}
                </PositionSlot>
              ))}
            </SoccerField>

            <div className="tactics-board-bench">
              <div className="tactics-board-bench-column">
                <h4 className="tactics-board-bench-title">{visibleTeamLabel} 벤치</h4>
                <div className="tactics-board-bench-list">
                  {visibleBenchSlots.map((slot) => (
                    <PositionSlot key={slot.id} slot={slot}>
                      {slotToPlayer[slot.id] && (
                        <PlayerDraggable
                          player={playerById[slotToPlayer[slot.id]]}
                          team={viewTeam}
                        />
                      )}
                    </PositionSlot>
                  ))}
                </div>
              </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
              {activePlayer && (
                <div
                  className={[
                    'player-draggable',
                    playerTeamMap[activePlayer.id] === 'A' ? 'player-draggable-a' : 'player-draggable-b',
                    'is-overlay',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="player-draggable-name">{activePlayer.nickname}</span>
                  <span className="player-draggable-meta">{activePlayer.position || 'POS'}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="tactics-board-actions">
          <Button variant="secondary" onClick={handleDownload} disabled={isExporting}>
            📥 이미지 저장
          </Button>
          <Button variant="primary" onClick={handleShare} disabled={isExporting}>
            📤 공유하기
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default TacticsBoard;
