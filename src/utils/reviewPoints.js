/**
 * 평가 포인트 유틸리티
 * 평가 완료 시 적립되는 포인트를 LocalStorage에 누적 관리한다.
 */

const POINTS_KEY = 'epl_review_points';

// 평가 1회 완료 시 적립 포인트
export const REVIEW_REWARD_POINTS = 10;

const readPoints = () => {
  try {
    const value = window.localStorage.getItem(POINTS_KEY);
    return value ? JSON.parse(value) : {};
  } catch (error) {
    console.error('평가 포인트 읽기 오류:', error);
    return {};
  }
};

/**
 * 사용자의 누적 평가 포인트 조회
 * @param {string} userId - 사용자 ID
 * @returns {number} 누적 포인트
 */
export const getReviewPoints = (userId) => {
  if (!userId) return 0;
  return Number(readPoints()[userId]) || 0;
};

/**
 * 평가 포인트 적립
 * @param {string} userId - 사용자 ID
 * @param {number} amount - 적립할 포인트
 * @returns {number} 적립 후 누적 포인트
 */
export const addReviewPoints = (userId, amount) => {
  if (!userId) return 0;

  const points = readPoints();
  const next = (Number(points[userId]) || 0) + amount;
  points[userId] = next;
  window.localStorage.setItem(POINTS_KEY, JSON.stringify(points));

  return next;
};
