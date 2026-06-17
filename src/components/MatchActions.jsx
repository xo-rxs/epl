import Button from './Button';
import Card from './Card';
import { exportToCSV, generateFilename } from '../utils/csvExport';
import { MATCH_STATUS_LABEL } from '../utils/matchStatus';

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

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
      '이름': p.name,
      '나이': p.age || '',
      '포지션': p.position,
      '스킬티어': p.skillTier || '',
      '실력점수': p.skillScore || 3,
      ...(match.teamAssignment ? { '팀': teamLabelById[p.id] || '미배정' } : {}),
      '참여시간': new Date(p.joinedAt).toLocaleString('ko-KR'),
    }));

    const filename = generateFilename(`${match.title}_참여자`);
    exportToCSV(csvData, filename);
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/?page=match&view=join&matchId=${match.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('링크가 복사되었습니다!');
  };

  const isRecruiting = match.status === 'recruiting';
  const isClosed = match.status === 'closed';
  const isFinished = match.status === 'finished';

  return (
    <Card
      header={
        <>
          <h3 className="card-header-title">경기 관리</h3>
          {onDelete && (
            <button
              type="button"
              className="btn btn-danger btn-icon btn-icon-sm"
              aria-label="경기 삭제"
              title="경기 삭제"
              onClick={() => {
                if (window.confirm('경기를 삭제하시겠습니까?')) {
                  onDelete();
                }
              }}
            >
              <TrashIcon />
            </button>
          )}
        </>
      }
    >
      {/* 모집 토글 */}
      {onStatusChange && !isFinished && (isRecruiting || isClosed) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-3)',
        }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
            {isRecruiting ? '모집 중' : '마감됨'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isRecruiting}
            aria-label={isRecruiting ? '모집 마감하기' : '모집 재개하기'}
            onClick={() => onStatusChange(isRecruiting ? 'closed' : 'recruiting')}
            style={{
              position: 'relative',
              width: '48px',
              height: '28px',
              borderRadius: '999px',
              border: 'none',
              background: isRecruiting ? 'var(--color-success)' : 'var(--color-gray-300)',
              cursor: 'pointer',
              transition: 'background 0.25s',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: '3px',
              left: isRecruiting ? '23px' : '3px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--color-white)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              transition: 'left 0.25s',
            }} />
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--spacing-3)',
      }}>
        <Button variant="primary" size="sm" onClick={handleCopyLink} fullWidth>
          링크 복사
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCSV}
          disabled={match.participants.length === 0}
          fullWidth
        >
          CSV 내보내기
        </Button>

        {onStatusChange && !isFinished && match.status !== 'ready' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStatusChange('ready')}
            fullWidth
          >
            준비 완료
          </Button>
        )}

        {onStatusChange && match.status === 'ready' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onStatusChange('recruiting')}
            fullWidth
          >
            준비완료 취소
          </Button>
        )}

        {onStatusChange && !isFinished && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm('경기를 종료하시겠습니까? 종료 후에는 상태를 변경할 수 없습니다.')) {
                onStatusChange('finished');
              }
            }}
            fullWidth
          >
            경기 종료
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
        {match.isPrivate && ' · 비공개'}
        <br />
        <strong>생성:</strong> {new Date(match.createdAt).toLocaleString('ko-KR')}
      </div>
    </Card>
  );
}

export default MatchActions;
