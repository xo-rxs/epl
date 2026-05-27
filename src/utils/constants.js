/**
 * 공통 상수 정의
 */

// 위치 (포지션)
export const POSITIONS = {
  GK: { label: '골키퍼', shortLabel: 'GK' },
  DF: { label: '수비수', shortLabel: 'DF' },
  MF: { label: '미드필더', shortLabel: 'MF' },
  FW: { label: '공격수', shortLabel: 'FW' },
};

export const POSITION_OPTIONS = Object.entries(POSITIONS).map(([key, value]) => ({
  value: key,
  label: value.label,
}));

// 학년
export const YEARS = {
  1: { label: '1학년' },
  2: { label: '2학년' },
  3: { label: '3학년' },
  4: { label: '4학년' },
  5: { label: '5학년' },
  6: { label: '6학년' },
};

export const YEAR_OPTIONS = Object.entries(YEARS).map(([key, value]) => ({
  value: parseInt(key),
  label: value.label,
}));

// 실력 평가 (1-5점)
export const SKILL_LEVELS = {
  1: { label: '초급', color: '#e74c3c' },
  2: { label: '하', color: '#f39c12' },
  3: { label: '중', color: '#f1c40f' },
  4: { label: '상', color: '#27ae60' },
  5: { label: '최상', color: '#2ecc71' },
};

// 경기 상태
export const MATCH_STATUS = {
  RECRUITING: 'recruiting',      // 모집 중
  READY: 'ready',               // 준비 완료
  PLAYING: 'playing',           // 진행 중
  FINISHED: 'finished',         // 종료
  CANCELLED: 'cancelled',       // 취소
};

export const MATCH_STATUS_LABELS = {
  recruiting: '모집 중',
  ready: '준비 완료',
  playing: '진행 중',
  finished: '종료',
  cancelled: '취소됨',
};

// 팀
export const TEAMS = {
  A: { label: '팀 A', color: '#3498db' },
  B: { label: '팀 B', color: '#e74c3c' },
};

// 에러 메시지
export const ERROR_MESSAGES = {
  REQUIRED: '필수 입력 항목입니다.',
  INVALID_EMAIL: '유효한 이메일 형식이 아닙니다.',
  INVALID_NICKNAME: '닉네임은 2-20자의 한글/영문/숫자만 가능합니다.',
  NICKNAME_TAKEN: '이미 사용 중인 닉네임입니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  CREATED: '생성되었습니다.',
  UPDATED: '수정되었습니다.',
  DELETED: '삭제되었습니다.',
  EXPORTED: '내보내기 완료했습니다.',
};

// LocalStorage 키
export const STORAGE_KEYS = {
  MATCHES: 'epl_matches',
  TEAMS: 'epl_teams',
  REVIEWS: 'epl_reviews',
  USER_PROFILE: 'epl_user_profile',
};

// 페이지네이션
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// 시간 설정
export const TIME_FORMAT = {
  DISPLAY: 'YYYY-MM-DD HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss',
};
