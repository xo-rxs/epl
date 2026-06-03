import { useCallback, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const createDummyParticipant = ({
  id,
  name,
  age,
  position,
  skillTier,
  skillScore,
  status = 'approved',
  joinedOffset = 0,
}) => ({
  id,
  userId: `dummy_${id}`,
  name,
  nickname: name,
  age,
  position,
  skillTier,
  skillScore,
  status,
  joinedAt: new Date(Date.now() - joinedOffset).toISOString(),
});

const DUMMY_MATCHES = [
  {
    id: 'match_dummy_last_slot',
    title: '목요 야간 풋살 - 1자리 남음',
    location: '잠실 풋살파크 A구장',
    datetime: '2026-06-04T20:00:00',
    maxParticipants: 22,
    description: '더미 데이터입니다. 현재 11대11 구성이 가능하도록 한 자리만 남겨둔 참여 신청 테스트용 경기입니다.',
    createdAt: '2026-06-01T09:00:00.000Z',
    status: 'recruiting',
    participants: [
      createDummyParticipant({ id: 'p_dummy_01', name: '김민준', age: 24, position: 'FW', skillTier: 'ALPINE', skillScore: 4, joinedOffset: 9000000 }),
      createDummyParticipant({ id: 'p_dummy_02', name: '이서준', age: 27, position: 'MF', skillTier: 'PEAK', skillScore: 3, joinedOffset: 8200000 }),
      createDummyParticipant({ id: 'p_dummy_03', name: '박도윤', age: 22, position: 'DF', skillTier: 'HIKER', skillScore: 2, joinedOffset: 7400000 }),
      createDummyParticipant({ id: 'p_dummy_04', name: '최지호', age: 29, position: 'GK', skillTier: 'PEAK', skillScore: 3, joinedOffset: 6600000 }),
      createDummyParticipant({ id: 'p_dummy_05', name: '정하준', age: 25, position: 'FW', skillTier: 'THE_GOAT', skillScore: 5, joinedOffset: 5800000 }),
      createDummyParticipant({ id: 'p_dummy_06', name: '강시우', age: 31, position: 'DF', skillTier: 'ALPINE', skillScore: 4, joinedOffset: 5000000 }),
      createDummyParticipant({ id: 'p_dummy_07', name: '윤도현', age: 23, position: 'MF', skillTier: 'HIKER', skillScore: 2, joinedOffset: 4200000 }),
      createDummyParticipant({ id: 'p_dummy_08', name: '조은우', age: 28, position: 'DF', skillTier: 'VALLEY', skillScore: 1, joinedOffset: 3400000 }),
      createDummyParticipant({ id: 'p_dummy_09', name: '한지민', age: 26, position: 'MF', skillTier: 'PEAK', skillScore: 3, joinedOffset: 2600000 }),
      createDummyParticipant({ id: 'p_dummy_19', name: '유건우', age: 30, position: 'FW', skillTier: 'HIKER', skillScore: 2, joinedOffset: 1800000 }),
      createDummyParticipant({ id: 'p_dummy_20', name: '하도윤', age: 24, position: 'MF', skillTier: 'ALPINE', skillScore: 4, joinedOffset: 1700000 }),
      createDummyParticipant({ id: 'p_dummy_21', name: '서이준', age: 33, position: 'DF', skillTier: 'PEAK', skillScore: 3, joinedOffset: 1600000 }),
      createDummyParticipant({ id: 'p_dummy_22', name: '이로운', age: 22, position: 'FW', skillTier: 'HIKER', skillScore: 2, joinedOffset: 1500000 }),
      createDummyParticipant({ id: 'p_dummy_23', name: '문시온', age: 29, position: 'MF', skillTier: 'PEAK', skillScore: 3, joinedOffset: 1400000 }),
      createDummyParticipant({ id: 'p_dummy_24', name: '배준서', age: 26, position: 'DF', skillTier: 'ALPINE', skillScore: 4, joinedOffset: 1300000 }),
      createDummyParticipant({ id: 'p_dummy_25', name: '차은호', age: 31, position: 'GK', skillTier: 'HIKER', skillScore: 2, joinedOffset: 1200000 }),
      createDummyParticipant({ id: 'p_dummy_26', name: '권지후', age: 27, position: 'FW', skillTier: 'PEAK', skillScore: 3, joinedOffset: 1100000 }),
      createDummyParticipant({ id: 'p_dummy_27', name: '백도하', age: 23, position: 'MF', skillTier: 'VALLEY', skillScore: 1, joinedOffset: 1000000 }),
      createDummyParticipant({ id: 'p_dummy_28', name: '오태민', age: 35, position: 'DF', skillTier: 'HIKER', skillScore: 2, joinedOffset: 900000 }),
      createDummyParticipant({ id: 'p_dummy_29', name: '임하람', age: 28, position: 'FW', skillTier: 'ALPINE', skillScore: 4, joinedOffset: 800000 }),
      createDummyParticipant({ id: 'p_dummy_30', name: '정우진', age: 25, position: 'MF', skillTier: 'PEAK', skillScore: 3, joinedOffset: 700000 }),
    ],
  },
  {
    id: 'match_dummy_weekend',
    title: '주말 오전 6대6 친선전',
    location: '여의도 공원 풋살장',
    datetime: '2026-06-06T09:30:00',
    maxParticipants: 12,
    description: '밸런스 팀 구성 확인용 더미 경기입니다.',
    createdAt: '2026-06-01T09:10:00.000Z',
    status: 'recruiting',
    participants: [
      createDummyParticipant({ id: 'p_dummy_10', name: '오현우', age: 21, position: 'FW', skillTier: 'PEAK', skillScore: 3 }),
      createDummyParticipant({ id: 'p_dummy_11', name: '임재윤', age: 30, position: 'MF', skillTier: 'ALPINE', skillScore: 4 }),
      createDummyParticipant({ id: 'p_dummy_12', name: '서민재', age: 24, position: 'DF', skillTier: 'HIKER', skillScore: 2 }),
      createDummyParticipant({ id: 'p_dummy_13', name: '문태오', age: 27, position: 'GK', skillTier: 'VALLEY', skillScore: 1, status: 'pending' }),
      createDummyParticipant({ id: 'p_dummy_14', name: '배유찬', age: 32, position: 'MF', skillTier: 'PEAK', skillScore: 3 }),
    ],
  },
  {
    id: 'match_dummy_ready',
    title: '수요 퇴근 후 미니게임',
    location: '상암 월드컵 보조구장',
    datetime: '2026-06-03T19:30:00',
    maxParticipants: 8,
    description: '승인/거절 상태 확인용 더미 경기입니다.',
    createdAt: '2026-06-01T09:20:00.000Z',
    status: 'ready',
    participants: [
      createDummyParticipant({ id: 'p_dummy_15', name: '남도겸', age: 25, position: 'FW', skillTier: 'ALPINE', skillScore: 4 }),
      createDummyParticipant({ id: 'p_dummy_16', name: '신유준', age: 29, position: 'MF', skillTier: 'HIKER', skillScore: 2 }),
      createDummyParticipant({ id: 'p_dummy_17', name: '권라온', age: 23, position: 'DF', skillTier: 'PEAK', skillScore: 3 }),
      createDummyParticipant({ id: 'p_dummy_18', name: '백이안', age: 34, position: 'GK', skillTier: 'VALLEY', skillScore: 1, status: 'rejected' }),
    ],
  },
];

const LAST_SLOT_DUMMY_MATCH_ID = 'match_dummy_last_slot';

const isDummyParticipant = (participant) => String(participant.userId || '').startsWith('dummy_');

const normalizeDummyMatch = (match) => {
  const dummyMatch = DUMMY_MATCHES.find((item) => item.id === match.id);

  if (!dummyMatch) {
    return match;
  }

  if (match.id !== LAST_SLOT_DUMMY_MATCH_ID) {
    return {
      ...dummyMatch,
      ...match,
    };
  }

  const realParticipants = (match.participants || []).filter(
    (participant) => !isDummyParticipant(participant)
  );
  const availableSlots = Math.max(
    0,
    dummyMatch.maxParticipants - dummyMatch.participants.length
  );

  return {
    ...match,
    title: dummyMatch.title,
    location: dummyMatch.location,
    datetime: dummyMatch.datetime,
    maxParticipants: dummyMatch.maxParticipants,
    description: dummyMatch.description,
    status: dummyMatch.status,
    participants: [
      ...dummyMatch.participants,
      ...realParticipants.slice(0, availableSlots),
    ],
  };
};

const mergeDummyMatches = (matches) => {
  const matchIds = new Set(matches.map((match) => match.id));
  const normalizedMatches = matches.map(normalizeDummyMatch);
  const missingDummyMatches = DUMMY_MATCHES.filter((match) => !matchIds.has(match.id));

  return [...missingDummyMatches, ...normalizedMatches];
};

/**
 * useMatchData 훅
 * 경기 데이터를 LocalStorage에서 관리
 * @returns {object} - {matches, createMatch, deleteMatch, getMatch, updateMatch}
 */
function useMatchData() {
  const [matches, setMatches] = useLocalStorage('epl_matches', []);

  useEffect(() => {
    const nextMatches = mergeDummyMatches(matches);
    const hasChanged = JSON.stringify(nextMatches) !== JSON.stringify(matches);

    if (hasChanged) {
      setMatches(nextMatches);
    }
  }, [matches, setMatches]);

  /**
   * 새 경기 생성
   */
  const createMatch = useCallback(
    (matchData) => {
      const newMatch = {
        id: `match_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'recruiting',
        participants: [],
        ...matchData,
      };

      setMatches((prev) => [newMatch, ...prev]);
      return newMatch;
    },
    [setMatches]
  );

  /**
   * 경기 수정
   */
  const updateMatch = useCallback(
    (matchId, updates) => {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? { ...match, ...updates, updatedAt: new Date().toISOString() }
            : match
        )
      );
    },
    [setMatches]
  );

  /**
   * 경기 삭제
   */
  const deleteMatch = useCallback(
    (matchId) => {
      setMatches((prev) => prev.filter((match) => match.id !== matchId));
    },
    [setMatches]
  );

  /**
   * 특정 경기 조회
   */
  const getMatch = useCallback(
    (matchId) => {
      return matches.find((match) => match.id === matchId);
    },
    [matches]
  );

  /**
   * 참여자 추가
   */
  const addParticipant = useCallback(
    (matchId, participantData) => {
      const participant = {
        id: `p_${Date.now()}`,
        joinedAt: new Date().toISOString(),
        status: 'pending',
        ...participantData,
      };

      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? { ...match, participants: [...match.participants, participant] }
            : match
        )
      );

      return participant;
    },
    [setMatches]
  );

  /**
   * 참여자 제거
   */
  const removeParticipant = useCallback(
    (matchId, participantId) => {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? {
                ...match,
                participants: match.participants.filter((p) => p.id !== participantId),
              }
            : match
        )
      );
    },
    [setMatches]
  );

  /**
   * 참여자 수정
   */
  const updateParticipant = useCallback(
    (matchId, participantId, updates) => {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? {
                ...match,
                participants: match.participants.map((p) =>
                  p.id === participantId ? { ...p, ...updates } : p
                ),
              }
            : match
        )
      );
    },
    [setMatches]
  );

  /**
   * 경기의 모든 참여자 조회
   */
  const getParticipants = useCallback(
    (matchId) => {
      const match = matches.find((m) => m.id === matchId);
      return match ? match.participants : [];
    },
    [matches]
  );

  return {
    matches,
    createMatch,
    updateMatch,
    deleteMatch,
    getMatch,
    addParticipant,
    removeParticipant,
    updateParticipant,
    getParticipants,
  };
}

export default useMatchData;
