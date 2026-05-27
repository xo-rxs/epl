import { getBalanceScore } from './yearWeighting';

/**
 * 배열 셔플
 * @param {Array} list
 * @returns {Array}
 */
const shuffle = (list) => {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 2팀 Snake Draft 패턴 인덱스
 * A, B, B, A 반복
 * @param {number} index
 * @returns {0|1}
 */
const getSnakeTeamIndex = (index) => {
  const pattern = [0, 1, 1, 0];
  return pattern[index % pattern.length];
};

/**
 * 단일 스네이크 드래프트 실행
 * @param {Array} participants
 * @returns {{teamA:Array, teamB:Array}}
 */
export const runSnakeDraft = (participants) => {
  const prepared = shuffle(participants).sort((a, b) => {
    const skillGap = Number(b.skillScore || 3) - Number(a.skillScore || 3);
    if (skillGap !== 0) return skillGap;
    return Number(a.year || 0) - Number(b.year || 0);
  });

  const teamA = [];
  const teamB = [];

  prepared.forEach((player, index) => {
    const targetTeam = getSnakeTeamIndex(index) === 0 ? teamA : teamB;
    targetTeam.push(player);
  });

  return { teamA, teamB };
};

/**
 * 학년 가중치 포함 최적 스네이크 결과 선택
 * @param {Array} participants
 * @param {object} options
 * @returns {{teamA:Array, teamB:Array, metrics:object}}
 */
export const buildBalancedTeams = (participants, options = {}) => {
  const yearWeight = Number(options.yearWeight ?? 0.6);
  const iterations = Number(options.iterations ?? 30);

  if (!participants || participants.length < 2) {
    return {
      teamA: participants || [],
      teamB: [],
      metrics: {
        score: 0,
        skillDiff: 0,
        yearPenalty: 0,
        avgYearA: 0,
        avgYearB: 0,
        totalSkillA: 0,
        totalSkillB: 0,
      },
    };
  }

  let best = null;

  for (let i = 0; i < iterations; i += 1) {
    const { teamA, teamB } = runSnakeDraft(participants);
    const metrics = getBalanceScore(teamA, teamB, yearWeight);

    if (!best || metrics.score < best.metrics.score) {
      best = { teamA, teamB, metrics };
    }
  }

  return best;
};
