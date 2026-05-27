import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import '../styles/PlayerDraggable.css';

function PlayerDraggable({ player, team }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
  };

  const className = [
    'player-draggable',
    team === 'A' ? 'player-draggable-a' : 'player-draggable-b',
    isDragging && 'is-dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      {...listeners}
      {...attributes}
    >
      <span className="player-draggable-name">{player.nickname}</span>
      <span className="player-draggable-meta">{player.position || 'POS'}</span>
    </div>
  );
}

export default PlayerDraggable;
