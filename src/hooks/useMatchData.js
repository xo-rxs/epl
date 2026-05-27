import { useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * useMatchData 훅
 * 경기 데이터를 LocalStorage에서 관리
 * @returns {object} - {matches, createMatch, deleteMatch, getMatch, updateMatch}
 */
function useMatchData() {
  const [matches, setMatches] = useLocalStorage('epl_matches', []);

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
