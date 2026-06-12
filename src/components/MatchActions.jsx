import Button from './Button';
import Card from './Card';
import { exportToCSV, generateFilename } from '../utils/csvExport';
import { MATCH_STATUS_LABEL } from '../utils/matchStatus';

/**
 * MatchActions 컴포넌트
 * 경기 관리 액션 (CSV 내보내기, 상태 변경 등)
 * @param {object} match - 경기 정보
 * @param {function} onStatusChange - 상태 변경 핸들러 (optional)
 * @param {function} onDelete - 경기 삭제 핸들러 (optional)
 */
function MatchActions({ match, onStatusChange, onDelete }) {
  if (!match) return null;

  // 팀 구성이 확정된 경우 참여자 ID → 팀 라벨 맵 생성
  const teamLabelById = {};
  if (match.teamAssignment) {
    (match.teamAssignment.teamA || []).forEach((p) => {
      teamLabelById[p.id] = 'A (블루)';
    });
    (match.teamAssignment.teamB || []).forEach((p) => {
      teamLabelById[p.id] = 'B (레드)';
    });
  }

  const handleExportCSV = () => {
    const csvData = match.participants.map((p, index) => ({
      '순서': index + 1,
      '이름': p.name || p.nickname,
      '나이': p.age || '',
      '포지션': p.position,
      '스킬티어': p.skillTier || '',
      '실력점수': p.skillScore || 3,
      ...(match.teamAssignment ? { '팀': teamLabelById[p.id] || '미배정' } : {}),
      '참여시간': new Date(p.joinedAt).toLocaleString('ko-KR'),
    }));

    const filename = generateFilename(
      `${match.title}_참여자`
    );

    exportToCSV(csvData, filename);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?page=match&view=join&matchId=${match.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('링크가 복사되었습니다!');
  };

  return (
    <Card
      header={<h3 className="card-header-title">⚙️ 경기 관리</h3>}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--spacing-3)',
      }}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCopyLink}
          fullWidth
        >
          📋 링크 복사
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCSV}
          disabled={match.participants.length === 0}
          fullWidth
        >
          📥 CSV 내보내기
        </Button>

        {onStatusChange && match.status === 'recruiting' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStatusChange('closed')}
            fullWidth
          >
            🔒 모집 마감
          </Button>
        )}

        {onStatusChange && match.status === 'closed' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStatusChange('recruiting')}
            fullWidth
          >
            🔓 모집 재개
          </Button>
        )}

        {onStatusChange && match.status !== 'ready' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStatusChange('ready')}
            fullWidth
          >
            ✅ 준비 완료
          </Button>
        )}

        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('경기를 삭제하시겠습니까?')) {
                onDelete();
              }
            }}
            fullWidth
          >
            🗑️ 경기 삭제
          </Button>
        )}
      </div>

      <div style={{
        marginTop: 'var(--spacing-4)',
        padding: 'var(--spacing-3) var(--spacing-4)',
        backgroundColor: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-base)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-gray-600)',
      }}>
        <strong>경기 ID:</strong> {match.id}
        <br />
        <strong>상태:</strong> {MATCH_STATUS_LABEL[match.status] || match.status}
        {match.isPrivate && ' · 🔒 비공개'}
        <br />
        <strong>생성:</strong> {new Date(match.createdAt).toLocaleString('ko-KR')}
      </div>
    </Card>
  );
}

export default MatchActions;
