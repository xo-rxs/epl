import Card from './Card';
import '../styles/ParticipantList.css';

/**
 * ParticipantList 컴포넌트
 * 참여자 목록 표시 및 관리
 * @param {Array} participants - 참여자 목록
 * @param {function} onRemove - 참여자 제거 핸들러
 * @param {function} onApprove - 참여 승인 핸들러
 * @param {function} onReject - 참여 거절 핸들러
 * @param {string} title - 카드 타이틀
 * @param {boolean} loading - 로딩 상태
 */
function ParticipantList({
  participants = [],
  onRemove,
  onApprove,
  onReject,
  title = '참여자 목록',
  loading = false,
}) {
  const getStatus = (participant) => participant.status || 'approved';
  const statusLabels = {
    pending: '대기',
    approved: '승인됨',
    rejected: '거절됨',
  };

  if (participants.length === 0) {
    return (
      <Card
        header={<h3 className="card-header-title">{title}</h3>}
      >
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-8)',
          color: 'var(--color-gray-600)',
        }}>
          <p style={{ fontSize: 'var(--font-size-lg)' }}>아직 참여자가 없습니다.</p>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-2)' }}>
            위의 폼에서 참여 신청을 등록해주세요.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3 className="card-header-title">{title}</h3>
          <span style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-white)',
            padding: 'var(--spacing-2) var(--spacing-3)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
          }}>
            {participants.length}명
          </span>
        </div>
      }
    >
      <div className="participant-list">
        {participants.map((participant, index) => (
          (() => {
            const status = getStatus(participant);
            return (
          <div key={participant.id} className="participant-item">
            <div className="participant-number">{index + 1}</div>
            <div className="participant-info">
              <div className="participant-name">{participant.name || participant.nickname}</div>
              <div className="participant-meta">
                <span className="participant-year">
                  {participant.age ? `${participant.age}세` : `${participant.year}학년`}
                </span>
                <span className="participant-position">{participant.position}</span>
                <span className="participant-position">실력 {participant.skillScore || 3}</span>
                <span className={`participant-status participant-status-${status}`}>
                  {statusLabels[status] || '대기'}
                </span>
              </div>
            </div>
            <div className="participant-actions">
              {status === 'pending' && onApprove && (
                <button
                  className="participant-action-btn approve"
                  onClick={() => onApprove(participant.id)}
                  disabled={loading}
                  title="참여 승인"
                >
                  승인
                </button>
              )}
              {status === 'pending' && onReject && (
                <button
                  className="participant-action-btn reject"
                  onClick={() => onReject(participant.id)}
                  disabled={loading}
                  title="참여 거절"
                >
                  거절
                </button>
              )}
              {onRemove && (
                <button
                  className="participant-remove-btn"
                  onClick={() => {
                    if (window.confirm(`${participant.name || participant.nickname}을(를) 제거하시겠습니까?`)) {
                      onRemove(participant.id);
                    }
                  }}
                  disabled={loading}
                  title="참여 취소"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
            );
          })()
        ))}
      </div>
    </Card>
  );
}

export default ParticipantList;
