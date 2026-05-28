import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
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

const clampPercent = (value, min = 4, max = 96) => Math.min(max, Math.max(min, value));

const buildInitialPlacements = (teams, benchSlotsByTeam, positions) => {
  const placements = {};

  Object.entries(teams).forEach(([teamId, players]) => {
    const benchSlots = benchSlotsByTeam[teamId] || [];
    players.forEach((player, index) => {
      if (index < positions.length) {
        const position = positions[index];
        placements[player.id] = {
          area: 'field',
          x: teamId === 'A' ? position.x : mirrorX(position.x),
          y: position.y,
        };
        return;
      }

      const benchIndex = index - positions.length;
      const benchSlot = benchSlots[benchIndex] || benchSlots[benchSlots.length - 1];
      if (benchSlot) {
        placements[player.id] = {
          area: 'bench',
          benchSlotId: benchSlot.id,
        };
      }
    });
  });

  return placements;
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

const fieldFirstCollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length) {
    const fieldCollision = pointerCollisions.find((collision) =>
      String(collision.id).startsWith('field-')
    );
    return fieldCollision ? [fieldCollision] : pointerCollisions;
  }

  return closestCenter(args);
};

function BenchSlot({ slot, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  const slotClassName = [
    'tactics-board-slot',
    slot.type === 'bench' && 'tactics-board-slot-bench',
    isOver && 'is-over',
    slot.team === 'A' ? 'team-a' : 'team-b',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setNodeRef} className={slotClassName}>
      <div className="tactics-board-slot-label">{slot.label}</div>
      <div className="tactics-board-slot-content">{children}</div>
    </div>
  );
}

function FieldDropArea({ team, fieldRef, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `field-${team}` });

  const setRefs = useCallback(
    (node) => {
      setNodeRef(node);
      fieldRef.current = node;
    },
    [setNodeRef, fieldRef]
  );

  const className = ['tactics-board-field', isOver && 'is-over'].filter(Boolean).join(' ');

  return (
    <div ref={setRefs} className={className}>
      {children}
    </div>
  );
}

function TacticsBoard({ match }) {
  const boardRef = useRef(null);
  const fieldAreaRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewTeam, setViewTeam] = useState('A');

  const teamAssignment = match?.teamAssignment;
  const teamA = teamAssignment?.teamA || [];
  const teamB = teamAssignment?.teamB || [];

  const benchSizeA = Math.max(4, teamA.length - FIELD_POSITIONS.length);
  const benchSizeB = Math.max(4, teamB.length - FIELD_POSITIONS.length);

  const benchSlotsA = useMemo(() => buildBenchSlots('A', benchSizeA), [benchSizeA]);
  const benchSlotsB = useMemo(() => buildBenchSlots('B', benchSizeB), [benchSizeB]);

  const benchSlotsByTeam = useMemo(
    () => ({
      A: benchSlotsA,
      B: benchSlotsB,
    }),
    [benchSlotsA, benchSlotsB]
  );

  const allBenchSlots = useMemo(
    () => [...benchSlotsA, ...benchSlotsB],
    [benchSlotsA, benchSlotsB]
  );

  const slotById = useMemo(() => {
    return allBenchSlots.reduce((acc, slot) => {
      acc[slot.id] = slot;
      return acc;
    }, {});
  }, [allBenchSlots]);

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

  const [playerPlacements, setPlayerPlacements] = useState(() =>
    buildInitialPlacements({ A: teamA, B: teamB }, benchSlotsByTeam, FIELD_POSITIONS)
  );

  useEffect(() => {
    setPlayerPlacements(buildInitialPlacements({ A: teamA, B: teamB }, benchSlotsByTeam, FIELD_POSITIONS));
  }, [teamA, teamB, benchSlotsByTeam]);

  const benchSlotToPlayer = useMemo(() => {
    return Object.entries(playerPlacements).reduce((acc, [playerId, placement]) => {
      if (placement?.area === 'bench' && placement.benchSlotId) {
        acc[placement.benchSlotId] = playerId;
      }
      return acc;
    }, {});
  }, [playerPlacements]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } })
  );

  const activePlayer = activeId ? playerById[activeId] : null;
  const visibleBenchSlots = viewTeam === 'A' ? benchSlotsA : benchSlotsB;
  const visibleTeamLabel = viewTeam === 'A' ? '팀 A' : '팀 B';
  const visibleFieldPlayers = useMemo(() => {
    return players
      .filter((player) => playerTeamMap[player.id] === viewTeam)
      .map((player) => ({
        player,
        placement: playerPlacements[player.id],
      }))
      .filter(({ placement }) => placement?.area === 'field');
  }, [players, playerPlacements, playerTeamMap, viewTeam]);

  const handleDragStart = (event) => {
    setActiveId(event.active?.id || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activePlayerId = active.id;
    const playerTeam = playerTeamMap[activePlayerId];
    if (!playerTeam) return;

    if (over.id === `field-${playerTeam}`) {
      const rect = active.rect?.current?.translated || active.rect?.current?.initial;
      const fieldRect = fieldAreaRef.current?.getBoundingClientRect();
      if (!rect || !fieldRect || !fieldRect.width || !fieldRect.height) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = clampPercent(((centerX - fieldRect.left) / fieldRect.width) * 100);
      const y = clampPercent(((centerY - fieldRect.top) / fieldRect.height) * 100);

      setPlayerPlacements((prev) => ({
        ...prev,
        [activePlayerId]: { area: 'field', x, y },
      }));
      return;
    }

    const targetSlotId = over.id;
    const targetSlot = slotById[targetSlotId];

    if (!targetSlot) return;
    if (targetSlot.team !== playerTeam) return;

    setPlayerPlacements((prev) => {
      const next = { ...prev };
      const previousPlacement = prev[activePlayerId];
      const occupiedPlayerId = Object.entries(prev).find(
        ([, placement]) => placement?.area === 'bench' && placement.benchSlotId === targetSlotId
      )?.[0];

      next[activePlayerId] = { area: 'bench', benchSlotId: targetSlotId };

      if (occupiedPlayerId && occupiedPlayerId !== activePlayerId) {
        if (previousPlacement?.area === 'bench' && previousPlacement.benchSlotId) {
          next[occupiedPlayerId] = {
            area: 'bench',
            benchSlotId: previousPlacement.benchSlotId,
          };
        } else if (previousPlacement?.area === 'field') {
          next[occupiedPlayerId] = {
            area: 'field',
            x: previousPlacement.x,
            y: previousPlacement.y,
          };
        }
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
            collisionDetection={fieldFirstCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="tactics-board-layout">
              <div className="tactics-board-field-column">
                <SoccerField>
                  <FieldDropArea team={viewTeam} fieldRef={fieldAreaRef}>
                    {visibleFieldPlayers.map(({ player, placement }) => (
                      <div
                        key={player.id}
                        className="tactics-board-field-player"
                        style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
                      >
                        <PlayerDraggable player={player} team={viewTeam} />
                      </div>
                    ))}
                  </FieldDropArea>
                </SoccerField>
              </div>

              <div className="tactics-board-bench">
                <div className="tactics-board-bench-column">
                  <h4 className="tactics-board-bench-title">{visibleTeamLabel} 벤치</h4>
                  <div className="tactics-board-bench-list">
                    {visibleBenchSlots.map((slot) => (
                      <BenchSlot key={slot.id} slot={slot}>
                        {benchSlotToPlayer[slot.id] && (
                          <PlayerDraggable
                            player={playerById[benchSlotToPlayer[slot.id]]}
                            team={viewTeam}
                          />
                        )}
                      </BenchSlot>
                    ))}
                  </div>
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
