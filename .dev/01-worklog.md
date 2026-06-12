# Worklog

## 2026-06-12

### 작업 내용
사용자 피드백(채팅방 수집분) 반영:
- 모집 마감 표시: 정원 충족/수동 마감 시 회색 '마감' 배지, 남은 자리 2 이하 시 '마감임박 · N자리 남음' 배지 + 카드 빨간 테두리/옅은 빨간 배경 강조 (경기 목록 + 일정 페이지 공통, src/utils/matchStatus.js 신규)
- 경기 목록 카드에 날짜·시간 표시 (이모지 대신 일시/장소/인원 라벨 행으로 표기)
- 지역 범위: 경기 생성 시 지역(시/도) 선택 + 목록 '지역 필터' 버튼 → 체크박스 패널(다중 선택, 초기화 버튼)
- 비공개 매치: 생성 폼 체크박스 → 목록 미노출, 공유 링크로만 접근
- 공지사항: 관리 화면에서 작성/저장 → 참여 신청 화면에 노출
- 모집 마감/재개 버튼 추가 (MatchActions), 마감 경기는 신청 버튼 비활성 + 안내
- 평가 개편: 팀장 단독 → 참여자 전원이 평가 가능 (평가자별 reviewsByUser 저장), 본인은 평가 대상 제외
- 익명 보장: 평가자 ID를 단방향 해시(anon_xxx)로만 저장
- 평가 혜택: 평가는 선택사항 명시, 첫 저장 시 10P 적립 (epl_review_points)
- 저장 토스트: 화면 하단 고정형으로 개선 + '마이페이지에서 확인 →' 버튼
- 마이페이지: 선호 포지션/스킬 티어 수정 기능(useAuthData.updateProfile), 받은 평가 요약(평균 별점·횟수·자주 받은 태그)과 평가 포인트 표시
- 전 페이지 네비게이션에 '마이페이지' 추가
- CSV 팀 분배: 팀 확정 시 참여자 CSV에 '팀' 컬럼 포함 (MatchActions)
- 이미지 깨짐 수정: html2canvas allowTaint 제거 (캔버스 오염 → toBlob 실패 원인)

### 미반영 (백로그)
- 팀 채팅방: 서버/실시간 인프라 필요, LocalStorage 기반 현 구조로는 불가

### 주요 변경 파일
- src/utils/matchStatus.js (신규), src/utils/constants.js (신규), src/utils/reviewPoints.js (신규)
- src/pages/MatchPage.jsx, src/pages/ReviewPage.jsx, src/pages/AuthPage.jsx, src/pages/SchedulePage.jsx, src/pages/TeamPage.jsx, src/App.jsx
- src/components/MatchForm.jsx, src/components/ParticipantForm.jsx, src/components/MatchActions.jsx
- src/hooks/useAuthData.js
- src/styles/AuthPage.css, src/styles/ReviewPage.css
- src/utils/imageExport.js

### 검증 결과
- npm run lint: 기존 3개 에러 그대로 (신규 에러 0, stash 비교로 확인)
- 브라우저 확인: 목록 배지/날짜/지역 필터, 비공개 숨김+링크 접근, 공지 저장→노출, 마감 경기 신청 차단, 본인 제외 평가→익명 저장→10P 적립(중복 적립 없음), 마이페이지 요약/프로필 수정 모두 정상

## 2026-06-09

### 작업 내용
- 쓸데없는(미사용) 코드 정리 + 초보자도 읽기 쉽게 리팩토링
- 어디서도 import되지 않는 죽은 util 파일 3개 삭제
  - src/utils/constants.js (POSITIONS/YEARS 등 어떤 페이지도 사용 안 함, 각 페이지가 자체 상수 보유)
  - src/utils/validators.js (MatchForm이 자체 validateForm을 가지고 있어 미사용)
  - src/utils/index.js (위 파일들을 re-export하던 배럴, 실제 import는 전부 직접 경로라 미사용)
- lint가 잡던 죽은 코드 제거
  - src/hooks/useLocalStorage.js: 사용하지 않는 useEffect import 삭제
  - src/pages/MatchPage.jsx: 사용하지 않는 newMatch 변수 제거
- App.jsx 라우팅 단순화(초보자 가독성)
  - 반복되던 `if (page === ...)` 분기를 PAGE_COMPONENTS 표 + getPageFromUrl() 한 곳으로 통합
  - 하단 렌더 분기도 같은 표를 재사용하도록 정리, 한글 주석 추가

### 주요 변경 파일
- src/utils/constants.js (삭제)
- src/utils/validators.js (삭제)
- src/utils/index.js (삭제)
- src/hooks/useLocalStorage.js
- src/pages/MatchPage.jsx
- src/App.jsx

### 검증 결과
- npm run lint: 기존 5개 → 3개 (제거한 2개는 위 죽은 코드, 남은 3개는 기존부터 있던 MatchPage/ReviewPage의 set-state-in-effect 경고로 이번 작업과 무관)
- npm run build: 성공

### 메모
- 남은 set-state-in-effect 경고는 이펙트 구조 개선이 필요한 별도 과제(죽은 코드 아님)로 남겨둠

## 2026-06-08

### 작업 내용
- 일정확인(내 일정) 기능 추가: 월 캘린더 + 내가 참여한 경기만 표시
- SchedulePage 신규 및 전 페이지 네비게이션에 "일정" 탭 추가

### 주요 변경 파일
- src/pages/SchedulePage.jsx (신규)
- src/styles/SchedulePage.css (신규)
- src/App.jsx
- src/pages/MatchPage.jsx
- src/pages/TeamPage.jsx
- src/pages/ReviewPage.jsx

### 검증 결과
- npm run build: 성공
- 브라우저 확인: 캘린더 렌더/날짜 선택/경기 카드/모바일 반응형 정상
- 상세: today-dev/2026-06-08-devlog.md 참고

## 2026-04-24

### 작업 내용
- React 기초 환경 구성 완료
- 공통 UI 컴포넌트(Button, Card, Input, Header, Layout, Container) 추가
- 경기 모집/참여 기능(Phase 1) 구현
- import 경로 오류 수정 및 빌드 정상화
- MatchPage 삭제 액션과 LocalStorage 삭제 연동 완료
- 선택 경기 ID 기반 currentMatch 자동 동기화 구조로 개선
- 홈/경기 페이지 URL 전환 로직 및 popstate 동기화 완료
- Phase 2 시작: Snake Draft 팀 빌딩 알고리즘 구현
- TeamPage 및 TeamBuilder UI 추가
- 참가자 입력에 실력 점수(1~5) 필드 추가 및 CSV 내보내기 반영

### 주요 변경 파일
- src/App.jsx
- src/pages/MatchPage.jsx
- src/components/MatchForm.jsx
- src/components/ParticipantForm.jsx
- src/components/ParticipantList.jsx
- src/components/MatchActions.jsx
- src/hooks/useMatchData.js
- src/styles/ParticipantList.css
- src/pages/TeamPage.jsx
- src/components/TeamBuilder.jsx
- src/utils/snakeDraft.js
- src/utils/yearWeighting.js
- src/styles/TeamBuilder.css

### 검증 결과
- npm run build: 성공
- Vite import-analysis 오류 해결 확인
- 안정화 수정 이후 npm run build 재검증: 성공
- Phase 2 기능 추가 후 npm run build: 성공

### 메모
- Phase 1 안정화 1차 완료, 다음은 홈/경기 페이지 전환 구조 정리
