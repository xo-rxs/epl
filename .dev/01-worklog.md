# Worklog

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
