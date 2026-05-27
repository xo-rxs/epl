# Issues

## 2026-04-24

### [해결] Vite import-analysis 경로 오류
- 증상: src/pages/MatchPage.jsx에서 ./components 해석 실패
- 원인: pages 폴더로 파일 이동 후 상대 경로 미수정
- 해결:
  - ./components -> ../components
  - ./hooks -> ../hooks
- 상태: 해결 완료

### [해결] useForm export 누락처럼 보인 빌드 오류
- 증상: useForm is not exported by src/utils/index.js
- 원인: 컴포넌트에서 useForm import 경로를 utils로 잘못 지정
- 해결:
  - ../utils -> ../hooks 로 변경
- 상태: 해결 완료

### [해결] MatchPage 삭제 액션 실제 데이터 삭제 미연결
- 증상: handleDeleteMatch가 화면 상태만 초기화
- 원인: deleteMatch 호출 누락
- 해결:
  - useMatchData 구조 분해에 deleteMatch 추가
  - handleDeleteMatch에서 deleteMatch(currentMatch.id) 호출
  - selectedMatchId/currentMatch/URL을 함께 초기화해 상태 불일치 제거
- 상태: 해결 완료

### [해결] currentMatch 동기화 지연/불일치 가능성
- 증상: 참여자 추가/삭제 직후 currentMatch를 즉시 조회할 때 stale 상태 가능
- 원인: setMatches 비동기 반영 시점과 수동 setCurrentMatch 타이밍 차이
- 해결:
  - selectedMatchId 상태를 기준으로 matches 변경 시 currentMatch를 재계산
  - 수동 currentMatch 재조회 코드 제거
- 상태: 해결 완료
