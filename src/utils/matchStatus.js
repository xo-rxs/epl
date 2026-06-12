/**
 * 경기 모집 상태 유틸리티
 * 정원·상태를 종합해 목록 카드 등에 표시할 배지를 결정한다.
 */

// 마감임박으로 간주할 남은 자리 수
const IMMINENT_REMAINING_SLOTS = 2;

// 거절되지 않은 참여자 수 (대기 + 승인)
export const getActiveParticipantCount = (match) =>
  (match.participants || []).filter(
    (participant) => (participant.status || 'approved') !== 'rejected'
  ).length;

// 정원이 가득 찼는지 여부
export const isMatchFull = (match) =>
  getActiveParticipantCount(match) >= (match.maxParticipants || 0);

// 참여 신청이 불가능한 상태인지 여부 (수동 마감 / 정원 충족 / 모집 종료)
export const isJoinClosed = (match) =>
  match.status !== 'recruiting' || isMatchFull(match);

/**
 * 경기 상태 배지 계산
 * @returns {{type: string, label: string, color: string}} 배지 종류·라벨·배경색
 *   type: 'closed' | 'ready' | 'imminent' | 'recruiting'
 */
export const getMatchBadge = (match) => {
  if (match.status === 'closed' || isMatchFull(match)) {
    return { type: 'closed', label: '마감', color: 'var(--color-gray-600)' };
  }

  if (match.status === 'ready') {
    return { type: 'ready', label: '준비 완료', color: 'var(--color-success)' };
  }

  const remaining = (match.maxParticipants || 0) - getActiveParticipantCount(match);
  if (remaining <= IMMINENT_REMAINING_SLOTS) {
    return { type: 'imminent', label: `마감임박 · ${remaining}자리 남음`, color: 'var(--color-error)' };
  }

  return { type: 'recruiting', label: '모집 중', color: 'var(--color-info)' };
};

// 경기 상태 한글 라벨
export const MATCH_STATUS_LABEL = {
  recruiting: '모집 중',
  ready: '준비 완료',
  closed: '마감',
};
