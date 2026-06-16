import Button from './Button';
import Card from './Card';
import { useMatchData } from '../hooks';
import { getObjectiveSkillScore, getPeerSkillStats, getTierValueFromScore } from '../utils/skillScore';

const SKILL_TIER_SCORE = {
  THE_GOAT: 5,
  ALPINE: 4,
  PEAK: 3,
  HIKER: 2,
  VALLEY: 1,
};

const SKILL_TIER_LABEL = {
  THE_GOAT: 'THE GOAT',
  ALPINE: 'ALPINE',
  PEAK: 'PEAK',
  HIKER: 'HIKER',
  VALLEY: 'VALLEY',
};

/**
 * ParticipantForm 컴포넌트
 * 로그인한 사용자 정보 기반 참여 신청 폼
 * @param {function} onSubmit - 폼 제출 핸들러 (participantData 전달)
 * @param {object} currentUser - 현재 로그인 사용자
 * @param {number} currentCount - 현재 참여자 수
 * @param {number} maxCount - 최대 참가자 수
 * @param {boolean} isClosed - 모집 마감 여부 (정원 충족 또는 수동 마감)
 * @param {boolean} loading - 로딩 상태
 */
function ParticipantForm({
  onSubmit,
  currentUser,
  currentCount = 0,
  maxCount = 20,
  isClosed = false,
  loading = false,
}) {
  const { matches } = useMatchData();
  const isFull = isClosed || currentCount >= maxCount;
  const selfSkillScore = SKILL_TIER_SCORE[currentUser?.skillTier] || 3;
  // 동료 실력 평가가 있으면 자기평가와 합산한 보정 점수를 사용 (팀 배정 객관화)
  const peerStats = currentUser
    ? getPeerSkillStats(matches, currentUser.id)
    : { count: 0, avg: 0 };
  const skillScore = currentUser
    ? getObjectiveSkillScore(selfSkillScore, matches, currentUser.id)
    : selfSkillScore;
  // 동료 평가로 보정된 점수를 환산한 티어를 표시 (평가 없으면 자기평가 티어)
  const displayTierValue =
    peerStats.count > 0 ? getTierValueFromScore(skillScore) : currentUser?.skillTier;
  const skillTierLabel = SKILL_TIER_LABEL[displayTierValue] || '미입력';

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert('로그인 후 참여 신청할 수 있습니다.');
      window.location.href = '/?page=auth';
      return;
    }

    if (isFull) {
      alert('모집이 마감된 경기입니다.');
      return;
    }

    onSubmit({
      userId: currentUser.id,
      name: currentUser.name || currentUser.nickname,
      nickname: currentUser.name || currentUser.nickname,
      age: Number(currentUser.age),
      position: currentUser.preferredPosition,
      skillTier: currentUser.skillTier,
      skillScore,
    });
  };

  return (
    <Card
      header={<h3 className="card-header-title">참여 신청</h3>}
      footer={
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
            참가자: {currentCount} / {maxCount}
          </span>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              onClick={handleSubmit}
              disabled={isFull}
            >
              {isFull ? '마감' : '신청하기'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {currentUser ? (
          <div
            style={{
              display: 'grid',
              gap: 'var(--spacing-3)',
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--color-gray-50)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-base)',
            }}
          >
            <div>
              <strong>{currentUser.name || currentUser.nickname}</strong>
              <span style={{ marginLeft: 'var(--spacing-2)', color: 'var(--color-gray-600)' }}>
                {currentUser.age}세
              </span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
              <span className="participant-status participant-status-approved">
                {currentUser.preferredPosition}
              </span>
              <span className="participant-status participant-status-pending">
                {skillTierLabel}
              </span>
              <span className="participant-status participant-status-approved">
                실력 {skillScore}
                {peerStats.count > 0 && ' (보정)'}
              </span>
            </div>
            <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
              {peerStats.count > 0
                ? `동료 실력 평가 ${peerStats.count}회가 반영된 보정 점수로 팀 배정에 참여합니다.`
                : '마이페이지 정보로 참여 신청합니다. 경기 후 동료 평가가 쌓이면 실력 점수가 보정됩니다.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 'var(--spacing-3)',
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--color-gray-50)',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--radius-base)',
            }}
          >
            <p>로그인 후 내 정보로 참여 신청할 수 있습니다.</p>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = '/?page=auth';
              }}
            >
              로그인 / 회원가입
            </Button>
          </div>
        )}
      </form>

      {isFull && (
        <div style={{
          marginTop: 'var(--spacing-4)',
          padding: 'var(--spacing-3) var(--spacing-4)',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderLeft: '3px solid var(--color-error)',
          borderRadius: 'var(--radius-base)',
          color: 'var(--color-error)',
          fontSize: 'var(--font-size-sm)',
        }}>
          모집이 마감되었습니다. {currentCount >= maxCount ? '참가 인원이 모두 찼습니다.' : '주최자가 모집을 마감했습니다.'}
        </div>
      )}
    </Card>
  );
}

export default ParticipantForm;
