/**
 * 학년 편향 보정 유틸리티
 */

/**
 * 팀 평균 학년 계산
 * @param {Array} team - 팀 참가자 배열
 * @returns {number}
 */
export const getAverageYear = (team) => {
  if (!team || team.length === 0) return 0;
  const totalYear = team.reduce((sum, player) => sum + Number(player.year || 0), 0);
  return totalYear / team.length;
};

/**
 * 팀 총 실력 계산
 * @param {Array} team - 팀 참가자 배열
 * @returns {number}
 */
export const getTotalSkill = (team) => {
  if (!team || team.length === 0) return 0;
  return team.reduce((sum, player) => sum + Number(player.skillScore || 3), 0);
};

/**
 * 학년 편차 페널티 계산
 * @param {Array} teamA
 * @param {Array} teamB
 * @param {number} yearWeight - 학년 페널티 가중치
 * @returns {number}
 */
export const getYearBalancePenalty = (teamA, teamB, yearWeight = 0.6) => {
  const avgYearA = getAverageYear(teamA);
  const avgYearB = getAverageYear(teamB);
  const yearDiff = Math.abs(avgYearA - avgYearB);
  return yearDiff * yearWeight;
};

/**
 * 팀 밸런스 점수(낮을수록 좋음)
 * @param {Array} teamA
 * @param {Array} teamB
 * @param {number} yearWeight
 * @returns {object}
 */
export const getBalanceScore = (teamA, teamB, yearWeight = 0.6) => {
  const totalSkillA = getTotalSkill(teamA);
  const totalSkillB = getTotalSkill(teamB);
  const skillDiff = Math.abs(totalSkillA - totalSkillB);
  const yearPenalty = getYearBalancePenalty(teamA, teamB, yearWeight);
  const score = skillDiff + yearPenalty;

  return {
    score,
    skillDiff,
    yearPenalty,
    avgYearA: getAverageYear(teamA),
    avgYearB: getAverageYear(teamB),
    totalSkillA,
    totalSkillB,
  };
};
