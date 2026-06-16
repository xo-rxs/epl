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

// 점수(1~5) → 스킬 티어 값 매핑
const TIER_BY_SCORE = {
  1: 'VALLEY',
  2: 'HIKER',
  3: 'PEAK',
  4: 'ALPINE',
  5: 'THE_GOAT',
};

// 스킬 티어 값 → 점수 매핑 (역방향)
export const SCORE_BY_TIER = {
  VALLEY: 1,
  HIKER: 2,
  PEAK: 3,
  ALPINE: 4,
  THE_GOAT: 5,
};

/**
 * 보정 점수를 스킬 티어 값으로 환산 (반올림, 1~5로 클램프)
 * @param {number} score - 실력 점수 (1~5, 소수 허용)
 * @returns {string} 스킬 티어 값 (예: 'ALPINE')
 */
export const getTierValueFromScore = (score) => {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return TIER_BY_SCORE[rounded];
};

// 점수(1~5) ↔ 고도(m) 변환 기준점
// 에베레스트(8,848m)를 5점 만점 기준으로 설정
const SCORE_METER_BREAKPOINTS = [
  { score: 1.0, meter: 0 },
  { score: 1.5, meter: 500 },
  { score: 2.5, meter: 1500 },
  { score: 3.5, meter: 4000 },
  { score: 4.5, meter: 8000 },
  { score: 5.0, meter: 8848 },
];

/**
 * 점수를 고도(m)로 변환 (구간별 선형 보간)
 * @param {number} score - 실력 점수 (1~5)
 * @returns {number} 고도 (m)
 */
export const scoreToMeters = (score) => {
  const clamped = Math.max(1, Math.min(5, score));
  for (let i = 0; i < SCORE_METER_BREAKPOINTS.length - 1; i++) {
    const from = SCORE_METER_BREAKPOINTS[i];
    const to = SCORE_METER_BREAKPOINTS[i + 1];
    if (clamped >= from.score && clamped <= to.score) {
      const t = (clamped - from.score) / (to.score - from.score);
      return Math.round(from.meter + t * (to.meter - from.meter));
    }
  }
  return 8848;
};

/**
 * 현재 티어 내 진행률 계산
 * 티어 경계: VALLEY [1.0~1.5), HIKER [1.5~2.5), PEAK [2.5~3.5), ALPINE [3.5~4.5), THE_GOAT [4.5~5.0]
 * @param {number} score - 실력 점수 (1~5, 소수 허용)
 * @returns {{ current: string, next: string|null, pct: number, score: number }}
 */
export const getTierProgress = (score) => {
  const clamped = Math.max(1, Math.min(5, score));
  const tier = Math.min(5, Math.max(1, Math.round(clamped)));
  const lower = tier === 1 ? 1.0 : tier - 0.5;
  const upper = tier === 5 ? 5.0 : tier + 0.5;
  const pct = Math.round(((clamped - lower) / (upper - lower)) * 100);
  const next = tier < 5 ? TIER_BY_SCORE[tier + 1] : null;
  return {
    current: TIER_BY_SCORE[tier],
    next,
    pct: Math.max(0, Math.min(100, pct)),
    score: Math.round(clamped * 10) / 10,
  };
};
