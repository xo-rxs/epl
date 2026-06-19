/**
 * 레이더 차트 데이터 계산 유틸리티
 * 경기 평가 데이터(별점 + 태그)를 6개 축 점수로 변환한다.
 */

// 레이더 차트 6개 축 정의
export const RADAR_LABELS = ['실력', '매너', '팀플레이', '소통', '시간약속', '분위기'];

// 긍정 태그 → 차트 축 매핑
const TAG_AXIS_MAP = {
  '팀플레이가 좋아요': '팀플레이',
  '소통이 잘 돼요': '소통',
  '시간 약속을 잘 지켜요': '시간약속',
  '분위기가 좋아요': '분위기',
};

/**
 * 평가 entries 배열에서 레이더 차트용 점수 배열 계산
 * @param {Array} entries - { skillRating, rating, tags }[]
 * @returns {{ scores: number[], count: number } | null} 6개 축 점수(0~5) + 평가 수, 데이터 없으면 null
 */
export const computeRadarScores = (entries) => {
  if (!entries || entries.length === 0) return null;

  const skillRatings = [];
  const mannerRatings = [];
  const tagCounts = { '팀플레이': 0, '소통': 0, '시간약속': 0, '분위기': 0 };

  entries.forEach((entry) => {
    if (entry.skillRating > 0) skillRatings.push(entry.skillRating);
    if (entry.rating > 0) mannerRatings.push(entry.rating);
    (entry.tags || []).forEach((tag) => {
      const axis = TAG_AXIS_MAP[tag];
      if (axis) tagCounts[axis] += 1;
    });
  });

  const totalReviews = Math.max(skillRatings.length, mannerRatings.length, 1);
  const avg = (list) => (list.length ? list.reduce((s, v) => s + v, 0) / list.length : 0);

  // 태그 점수: 해당 태그를 선택한 비율 × 5 (0~5 스케일로 통일)
  const tagScore = (key) => (tagCounts[key] / totalReviews) * 5;

  const scores = [
    avg(skillRatings),
    avg(mannerRatings),
    tagScore('팀플레이'),
    tagScore('소통'),
    tagScore('시간약속'),
    tagScore('분위기'),
  ].map((v) => Math.round(v * 10) / 10);

  return { scores, count: entries.length };
};

/**
 * 경기 전체 평균 레이더 데이터 계산
 * reviewsByUser 아래 모든 리뷰어의 entries를 합산한다.
 * @param {object} reviewsByUser - match.reviewsByUser
 * @returns {{ scores: number[], count: number } | null}
 */
export const computeMatchRadarScores = (reviewsByUser) => {
  if (!reviewsByUser) return null;

  const allEntries = Object.values(reviewsByUser).flatMap((r) => r.entries || []);
  return computeRadarScores(allEntries);
};

/**
 * 경기 MOM(실력/매너) 집계
 * @param {object} reviewsByUser - match.reviewsByUser
 * @param {Array} participants - match.participants
 * @returns {{ skillMom: {participantId, name, votes}|null, mannerMom: {participantId, name, votes}|null } | null}
 */
export const computeMomResults = (reviewsByUser, participants) => {
  if (!reviewsByUser) return null;

  const skillVotes = {};
  const mannerVotes = {};

  Object.values(reviewsByUser).forEach((review) => {
    if (review.skillMom) skillVotes[review.skillMom] = (skillVotes[review.skillMom] || 0) + 1;
    if (review.mannerMom) mannerVotes[review.mannerMom] = (mannerVotes[review.mannerMom] || 0) + 1;
  });

  const findTop = (votes) => {
    const entries = Object.entries(votes);
    if (entries.length === 0) return null;
    const [participantId, voteCount] = entries.sort((a, b) => b[1] - a[1])[0];
    const participant = (participants || []).find((p) => p.id === participantId);
    return { participantId, name: participant?.name || '알 수 없음', votes: voteCount };
  };

  const skillMom = findTop(skillVotes);
  const mannerMom = findTop(mannerVotes);

  if (!skillMom && !mannerMom) return null;
  return { skillMom, mannerMom };
};

/**
 * 특정 사용자가 받은 평가의 레이더 데이터 계산
 * @param {Array} matches - 전체 경기 목록
 * @param {string} userId - 대상 사용자 ID
 * @returns {{ scores: number[], count: number } | null}
 */
export const computeUserRadarScores = (matches, userId) => {
  if (!matches || !userId) return null;

  const myEntries = [];

  matches.forEach((match) => {
    const myParticipantIds = new Set(
      (match.participants || [])
        .filter((p) => p.userId === userId)
        .map((p) => p.id)
    );
    if (myParticipantIds.size === 0) return;

    Object.values(match.reviewsByUser || {}).forEach((review) => {
      (review.entries || []).forEach((entry) => {
        if (myParticipantIds.has(entry.participantId)) {
          myEntries.push(entry);
        }
      });
    });
  });

  return computeRadarScores(myEntries);
};
