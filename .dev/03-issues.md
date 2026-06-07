# Issues

## 2026-06-04

### [해결] OS 다크 모드에서 폼/시스템 색상 반전으로 가독성 깨짐
- 증상: OS가 다크 모드일 때 입력창·드롭다운 등이 자동 반전되어 흰 배경에 흰 글씨 발생
- 원인: 브라우저가 prefers-color-scheme: dark 감지 시 폼 컨트롤을 다크 팔레트로 렌더링
- 해결:
  - src/styles/variables.css :root에 color-scheme: light 선언
  - index.html <head>에 <meta name="color-scheme" content="light"> 추가(초기 페인트 단계 반전 차단)
- 상태: 해결 완료

### [해결] 벤치 → 필드 드롭 시 기존 선수와 좌표 겹침
- 증상: 점유된 필드 위치로 선수를 드롭하면 두 선수가 같은 좌표에 겹쳐 한 명이 사라짐
- 원인: 드래그한 선수 좌표만 갱신하고 기존 선수를 옮기지 않음
- 해결:
  - 드롭 위치 9% 반경 내 같은 팀 필드 선수를 탐색해 위치 맞교환(swap)
  - 드래그 선수의 직전 상태(activePrev)가 벤치/필드인지 분기해 교체 대상 복원
  - 매 드롭마다 전체 배치 상태를 prev로 재구성 후 한 번에 setPlacementOverrides
- 상태: 해결 완료

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
