/**
 * 실력 점수 보정 유틸리티
 * 자기평가(스킬 티어) 점수에 동료들의 실력 평가를 합산해
 * 평가가 쌓일수록 더 객관적인 실력 점수를 만든다.
 */

/**
 * 사용자가 받은 동료 실력 평가 점수 목록 수집
 * @param {Array} matches - 전체 경기 목록
 * @param {string} userId - 사용자 ID
 * @returns {Array<number>} 받은 실력 평가 점수들 (1~5)
 */
export const getReceivedSkillRatings = (matches, userId) => {
  const ratings = [];

  (matches || []).forEach((match) => {
    const myParticipantIds = new Set(
      (match.participants || [])
        .filter((participant) => participant.userId === userId)
        .map((participant) => participant.id)
    );
    if (myParticipantIds.size === 0) return;

    Object.values(match.reviewsByUser || {}).forEach((review) => {
      (review.entries || []).forEach((entry) => {
        if (myParticipantIds.has(entry.participantId) && entry.skillRating > 0) {
          ratings.push(entry.skillRating);
        }
      });
    });
  });

  return ratings;
};

/**
 * 동료 실력 평가 통계 (횟수, 평균)
 */
export const getPeerSkillStats = (matches, userId) => {
  const ratings = getReceivedSkillRatings(matches, userId);
  const count = ratings.length;

  return {
    count,
    avg: count ? ratings.reduce((sum, rating) => sum + rating, 0) / count : 0,
  };
};

/**
 * 보정 실력 점수 계산
 * 자기평가를 1표로 두고 동료 평가들과 평균 — 평가가 많을수록 동료 평가 비중 증가
 * @param {number} selfScore - 자기평가(스킬 티어) 점수 (1~5)
 * @returns {number} 소수점 1자리 보정 점수 (동료 평가가 없으면 자기평가 그대로)
 */
export const getObjectiveSkillScore = (selfScore, matches, userId) => {
  const { count, avg } = getPeerSkillStats(matches, userId);
  if (count === 0) return selfScore;

  return Math.round(((selfScore + avg * count) / (count + 1)) * 10) / 10;
};
