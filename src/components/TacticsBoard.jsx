import { useMemo, useRef, useState, useCallback } from 'react';
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
  { id: 'GK', label: 'GK', x: 50, y: 90 },
  { id: 'LB', label: 'LB', x: 18, y: 78 },
  { id: 'LCB', label: 'LCB', x: 36, y: 78 },
  { id: 'RCB', label: 'RCB', x: 64, y: 78 },
  { id: 'RB', label: 'RB', x: 82, y: 78 },
  { id: 'LCM', label: 'LCM', x: 30, y: 52 },
  { id: 'CM', label: 'CM', x: 50, y: 52 },
  { id: 'RCM', label: 'RCM', x: 70, y: 52 },
  { id: 'LW', label: 'LW', x: 24, y: 26 },
  { id: 'ST', label: 'ST', x: 50, y: 26 },
  { id: 'RW', label: 'RW', x: 76, y: 26 },
];

const EMPTY_PLAYERS = [];

const FIELD_SECTIONS = [
  { id: 'LW', label: 'LW', xMin: 0, xMax: 34, yMin: 0, yMax: 34 },
  { id: 'ST', label: 'ST', xMin: 34, xMax: 66, yMin: 0, yMax: 34 },
  { id: 'RW', label: 'RW', xMin: 66, xMax: 100, yMin: 0, yMax: 34 },
  { id: 'LW_HIGH', label: 'LW', xMin: 0, xMax: 30, yMin: 34, yMax: 46 },
  { id: 'CAM', label: 'CAM', xMin: 30, xMax: 70, yMin: 34, yMax: 46 },
  { id: 'RW_HIGH', label: 'RW', xMin: 70, xMax: 100, yMin: 34, yMax: 46 },
  { id: 'LCM', label: 'LCM', xMin: 0, xMax: 34, yMin: 46, yMax: 58 },
  { id: 'CM', label: 'CM', xMin: 34, xMax: 66, yMin: 46, yMax: 58 },
  { id: 'RCM', label: 'RCM', xMin: 66, xMax: 100, yMin: 46, yMax: 58 },
  { id: 'LWB', label: 'LWB', xMin: 0, xMax: 30, yMin: 58, yMax: 70 },
  { id: 'CDM', label: 'CDM', xMin: 30, xMax: 70, yMin: 58, yMax: 70 },
  { id: 'RWB', label: 'RWB', xMin: 70, xMax: 100, yMin: 58, yMax: 70 },
  { id: 'LB', label: 'LB', xMin: 0, xMax: 26, yMin: 70, yMax: 84 },
  { id: 'LCB', label: 'LCB', xMin: 26, xMax: 44, yMin: 70, yMax: 84 },
  { id: 'CB', label: 'CB', xMin: 44, xMax: 56, yMin: 70, yMax: 84 },
  { id: 'RCB', label: 'RCB', xMin: 56, xMax: 74, yMin: 70, yMax: 84 },
  { id: 'RB', label: 'RB', xMin: 74, xMax: 100, yMin: 70, yMax: 84 },
  { id: 'GK', label: 'GK', xMin: 0, xMax: 100, yMin: 84, yMax: 100 },
];

const mirrorY = (y) => 100 - y;

const getSectionForPoint = (x, y, teamId) => {
  const normalizedY = teamId === 'B' ? mirrorY(y) : y;
  return (
    FIELD_SECTIONS.find(
      (section) =>
        x >= section.xMin &&
        x < section.xMax &&
        normalizedY >= section.yMin &&
        normalizedY < section.yMax
    ) || FIELD_SECTIONS[FIELD_SECTIONS.length - 1]
  );
};

const getSectionStyle = (section, teamId) => {
  const yMin = teamId === 'B' ? 100 - section.yMax : section.yMin;
  const yMax = teamId === 'B' ? 100 - section.yMin : section.yMax;

  return {
    left: `${section.xMin}%`,
    top: `${yMin}%`,
    width: `${section.xMax - section.xMin}%`,
    height: `${yMax - yMin}%`,
  };
};

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
        const y = teamId === 'A' ? position.y : mirrorY(position.y);
        const section = getSectionForPoint(position.x, y, teamId);
        placements[player.id] = {
          area: 'field',
          x: position.x,
          y,
          positionId: section.id,
          positionLabel: section.label,
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
      <div className="tactics-board-field-sections" aria-hidden="true">
        {FIELD_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="tactics-board-field-section"
            style={getSectionStyle(section, team)}
          >
            <span>{section.label}</span>
          </div>
        ))}
      </div>
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
  const teamA = teamAssignment?.teamA || EMPTY_PLAYERS;
  const teamB = teamAssignment?.teamB || EMPTY_PLAYERS;

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

  const initialPlacements = useMemo(
    () => buildInitialPlacements({ A: teamA, B: teamB }, benchSlotsByTeam, FIELD_POSITIONS),
    [teamA, teamB, benchSlotsByTeam]
  );

  const [placementOverrides, setPlacementOverrides] = useState({});

  const playerPlacements = useMemo(() => {
    return players.reduce((acc, player) => {
      acc[player.id] = placementOverrides[player.id] || initialPlacements[player.id];
      return acc;
    }, {});
  }, [initialPlacements, placementOverrides, players]);

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
      const section = getSectionForPoint(x, y, playerTeam);

      setPlacementOverrides((prevOverrides) => {
        const prev = players.reduce((acc, player) => {
          acc[player.id] = prevOverrides[player.id] || initialPlacements[player.id];
          return acc;
        }, {});

        // 드롭 위치 근처(9% 이내)에 같은 팀 필드 선수가 있으면 자리 교체
        const SWAP_THRESHOLD = 9;
        const nearbyPlayerId = Object.entries(prev).find(([pid, placement]) => {
          if (pid === activePlayerId) return false;
          if (playerTeamMap[pid] !== playerTeam) return false;
          if (placement?.area !== 'field') return false;
          return Math.abs(placement.x - x) < SWAP_THRESHOLD && Math.abs(placement.y - y) < SWAP_THRESHOLD;
        })?.[0];

        const next = { ...prevOverrides };
        const activePrev = prev[activePlayerId];

        if (nearbyPlayerId) {
          const nearbyPlacement = prev[nearbyPlayerId];
          // 드래그한 선수를 상대 위치로
          next[activePlayerId] = {
            area: 'field',
            x: nearbyPlacement.x,
            y: nearbyPlacement.y,
            positionId: nearbyPlacement.positionId,
            positionLabel: nearbyPlacement.positionLabel,
          };
          // 기존 선수를 드래그한 선수의 원래 위치로
          next[nearbyPlayerId] = activePrev?.area === 'bench'
            ? { area: 'bench', benchSlotId: activePrev.benchSlotId }
            : {
                area: 'field',
                x: activePrev.x,
                y: activePrev.y,
                positionId: activePrev.positionId,
                positionLabel: activePrev.positionLabel,
              };
        } else {
          next[activePlayerId] = {
            area: 'field',
            x,
            y,
            positionId: section.id,
            positionLabel: section.label,
          };
        }

        return next;
      });
      return;
    }

    const targetSlotId = over.id;
    const targetSlot = slotById[targetSlotId];

    if (!targetSlot) return;
    if (targetSlot.team !== playerTeam) return;

    setPlacementOverrides((prevOverrides) => {
      const prev = players.reduce((acc, player) => {
        acc[player.id] = prevOverrides[player.id] || initialPlacements[player.id];
        return acc;
      }, {});
      const next = { ...prevOverrides };
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
            positionId: previousPlacement.positionId,
            positionLabel: previousPlacement.positionLabel,
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
    <Card header={<h3 className="card-header-title">전술 배치도</h3>}>
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
                        <span className="tactics-board-position-badge">
                          {placement.positionLabel || getSectionForPoint(placement.x, placement.y, viewTeam).label}
                        </span>
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
            이미지 저장
          </Button>
          <Button variant="primary" onClick={handleShare} disabled={isExporting}>
            공유하기
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default TacticsBoard;
