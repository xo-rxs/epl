# EPL 프로젝트 개발 가이드

## 프로젝트 개요

**EPL (Easy Pick League)** 은 아마추어 축구 경기의 자동 매칭 및 팀 배정 플랫폼입니다.

### 핵심 목표
- 총무의 인원 관리 시간 80% 단축
- 객관적 알고리즘 기반 공정한 팀 배정
- 신입 참가자도 쉽게 참여할 수 있는 사용자 경험
- 신뢰도 기반 커뮤니티 형성

---

## 주요 서비스 기능

### ① 매치 모집 및 참여 취합 서비스
- 관리자 입력: 경기 일시, 장소, 정원
- 자동 생성: 참여 폼 생성
- 참가자 등록: 닉네임·학년·포지션 선택 → 즉시 참여 등록
- 저장 방식: React State + LocalStorage (서버 X)
- 내보내기: CSV 형식

**구현 파일 경로**
```
src/components/MatchForm.jsx     # 경기 정보 입력
src/components/ParticipantForm.jsx # 참여자 등록
src/hooks/useMatchData.js        # LocalStorage 관리
```

---

### ② 지능형 팀 빌딩 알고리즘
- 입력 데이터: 참여자의 실력 점수(1-10), 학년(1-4)
- 알고리즘: Snake Draft (드래프트 방식)
- 필터: 학년 가중치로 쏠림 방지
- 실행 위치: **프론트엔드 클라이언트** (서버 X)
- 재배정: '재배정' 버튼으로 즉시 새 조합 생성

**알고리즘 로직**
1. 참여자를 실력 점수순으로 정렬
2. Snake Draft 방식으로 팀 배분
3. 학년 가중치 검증 (각 팀의 평균 학년 차이 최소화)
4. 사용자 요청 시 1번부터 재수행

**구현 파일 경로**
```
src/utils/snakeDraft.js          # 팀 빌딩 알고리즘 구현
src/components/TeamBuilder.jsx   # 팀 배정 UI
src/hooks/useTeamData.js         # 팀 상태 관리
```

---

### ③ 드래그 앤 드롭 전술 포지션 배치도
- UI: 축구장 형태의 캔버스/SVG
- 상호작용: 팀원 아이콘을 드래그해 포지션 배치
- 지원: 모바일 터치 + 웹 마우스
- 저장: html2canvas로 PNG 이미지 캡처
- 공유: 카카오톡, 인스타그램 등 SNS 링크 공유

**라이브러리 선택**
- 드래그: `dnd-kit` (가볍고 모바일 지원 우수)
- 이미지: `html2canvas` (요소를 PNG로 변환)
- UI: SVG (축구장 배경 그리기)

**구현 파일 경로**
```
src/components/TacticsBoard.jsx  # 전술도 메인 컴포넌트
src/components/SoccerField.jsx   # 축구장 UI (SVG)
src/components/PlayerDraggable.jsx # 드래그 가능한 선수 아이콘
src/utils/imageExport.js         # html2canvas 유틸
```

---

### ④ 경기 후 상호 별점 리뷰 시스템
- 평가 대상: 각 선수가 경기에 함께한 모든 상대 평가
- 평가 항목: 실력(1-5점), 매너(1-5점)
- 저장 방식: LocalStorage에 누적
- 시각화: 레이더 차트로 개인 프로필 표시

**저장 데이터 구조**
```javascript
{
  "player_nickname": {
    skillScores: [3, 4, 4, 5],      // 실력 평가 이력
    mannerScores: [4, 4, 3, 5],     // 매너 평가 이력
    avgSkill: 4,                    // 평균 실력
    avgManner: 4,                   // 평균 매너
  }
}
```

**라이브러리 선택**
- 차트: `Chart.js` (레이더 차트 지원, 경량)
- 별점: React 커스텀 컴포넌트 또는 `react-rating`

**구현 파일 경로**
```
src/components/ReviewCard.jsx     # 별점 평가 UI
src/components/UserProfile.jsx    # 프로필 + 레이더 차트
src/hooks/useReviewData.js        # 평가 데이터 관리
src/utils/chartConfig.js          # Chart.js 설정
```

---

## 기술 스택 정의

| 레이어 | 선택 기술 | 이유 |
|--------|---------|------|
| **프레임워크** | React 19.x | 상태 관리 용이, 컴포넌트 재사용성 |
| **빌드 도구** | Vite | 빠른 개발 서버, 최적화된 빌드 |
| **상태 관리** | React Hooks | 소규모 프로젝트, 간단한 구조 |
| **드래그** | dnd-kit | 경량, 모바일 지원, 접근성 |
| **차트** | Chart.js | 레이더 차트 지원, 크기 최소화 |
| **이미지** | html2canvas | DOM 요소 → PNG 변환 |
| **데이터 저장** | LocalStorage | 서버 비용 절감, 오프라인 지원 |
| **CSV 내보내기** | Papa Parse 또는 커스텀 | 간단한 CSV 변환 |

---

## 프로젝트 디렉토리 구조

```
src/
├── components/
│   ├── MatchForm.jsx              # 경기 정보 입력 폼
│   ├── ParticipantForm.jsx        # 참여자 등록 폼
│   ├── TeamBuilder.jsx            # 팀 배정 UI
│   ├── TacticsBoard.jsx           # 드래그 앤 드롭 전술도
│   ├── SoccerField.jsx            # 축구장 배경 (SVG)
│   ├── PlayerDraggable.jsx        # 선수 아이콘 (드래그)
│   ├── ReviewCard.jsx             # 별점 평가 카드
│   ├── UserProfile.jsx            # 사용자 프로필 + 레이더 차트
│   └── MatchList.jsx              # 지난 경기 목록
│
├── hooks/
│   ├── useMatchData.js            # 경기 데이터 관리
│   ├── useTeamData.js             # 팀 배정 상태 관리
│   ├── useReviewData.js           # 평가 데이터 관리
│   └── useLocalStorage.js         # LocalStorage 커스텀 훅
│
├── utils/
│   ├── snakeDraft.js              # Snake Draft 알고리즘
│   ├── yearWeighting.js           # 학년 가중치 필터
│   ├── imageExport.js             # html2canvas 유틸
│   ├── csvExport.js               # CSV 내보내기
│   ├── validators.js              # 데이터 검증
│   └── constants.js               # 상수 정의
│
├── App.jsx
└── main.jsx

docs/
├── REQUIREMENTS.md                # 요구사항 상세 명세서
└── DOMAIN.md                      # 스포츠 매칭 도메인 지식

.claude/
├── CLAUDE.md                      # 이 파일 (AI 가이드)
└── rules/
    └── rule.md                    # 코딩 컨벤션 & 규칙
```

---

## 개발 우선순위

### Phase 1: MVP (기본 기능)
**목표**: 매치 모집 및 참여 취합 자동화 최소 기능 달성

- [ ] 경기 정보 입력 폼 UI
- [ ] 참여자 등록 폼 UI
- [ ] LocalStorage 기반 참여자 목록 관리
- [ ] 참여자 목록 표시 UI
- [ ] CSV 내보내기 기능
- [ ] 기본 스타일링 (모바일 반응형)

**완료 기준**: 링크 공유만으로 참여 현황 실시간 확인 + CSV 다운로드 가능

---

### Phase 2: 팀 빌딩
**목표**: 공정한 자동 팀 배정 알고리즘 구현

- [ ] Snake Draft 알고리즘 구현
- [ ] 학년 가중치 필터 로직
- [ ] 팀 배정 결과 표시 UI
- [ ] 재배정 기능
- [ ] 팀별 선수 상세 정보 표시

**완료 기준**: 알고리즘 기반 팀 배정 + 재배정 기능 동작

---

### Phase 3: 전술 배치도
**목표**: 시각적 포지션 배치 UI 구현

- [ ] 축구장 배경 SVG 제작
- [ ] dnd-kit 드래그 앤 드롭 구현
- [ ] 선수 아이콘 컴포넌트
- [ ] 모바일 터치 이벤트 지원
- [ ] html2canvas 이미지 저장 기능
- [ ] SNS 공유 링크 생성

**완료 기준**: 드래그로 포지션 배치 + PNG 저장 + SNS 공유 동작

---

### Phase 4: 별점 리뷰
**목표**: 누적 평가 시스템 및 프로필 시각화

- [ ] 별점 평가 UI 컴포넌트
- [ ] 평가 데이터 LocalStorage 저장
- [ ] 사용자 프로필 페이지
- [ ] Chart.js 레이더 차트 시각화
- [ ] 평가 통계 표시

**완료 기준**: 별점 평가 + 누적 프로필 레이더 차트 표시 동작

---

## 코딩 컨벤션 & 규칙

자세한 코딩 규칙은 [.claude/rules/rule.md](rules/rule.md)를 참고하세요.

### 핵심 원칙
1. **파일명**: PascalCase (컴포넌트), camelCase (유틸, 훅)
2. **변수명**: camelCase
3. **함수명**: camelCase (기능 설명적)
4. **상수명**: UPPER_SNAKE_CASE
5. **주석**: 한글 사용 (이해도 향상)

### 컴포넌트 구조
```javascript
// 1. Imports
import React, { useState } from 'react';

// 2. Constants (필요시)
const SOME_CONSTANT = 'value';

// 3. Component Function
function ComponentName() {
  // 3-1. Hooks (useState, useEffect 등)
  const [state, setState] = useState(initialValue);
  
  // 3-2. Handlers & Logic
  const handleClick = () => { /* ... */ };
  
  // 3-3. Effects (side effects)
  useEffect(() => { /* ... */ }, []);
  
  // 3-4. JSX Return
  return <div>{/* ... */}</div>;
}

// 4. Export
export default ComponentName;
```

---

## LocalStorage 데이터 구조

### 경기 데이터 (`epl_match`)
```json
{
  "matchId": "2024-04-24-001",
  "datetime": "2024-04-24T15:00:00",
  "location": "여의도 공원",
  "maxParticipants": 20,
  "participants": [
    {"id": "p1", "nickname": "철수", "year": 3, "position": "FW", "timestamp": 1234567890},
    {"id": "p2", "nickname": "영희", "year": 1, "position": "MF", "timestamp": 1234567891}
  ]
}
```

### 팀 배정 데이터 (`epl_teams`)
```json
{
  "matchId": "2024-04-24-001",
  "teamA": ["p1", "p3", "p5"],
  "teamB": ["p2", "p4", "p6"],
  "teamAAvgYear": 2.67,
  "teamBAvgYear": 2.67,
  "generatedAt": 1234567900
}
```

### 별점 평가 데이터 (`epl_reviews`)
```json
{
  "p1": {
    "reviews": [
      {"from": "p2", "skill": 4, "manner": 5, "matchId": "2024-04-24-001", "date": 1234567900}
    ],
    "avgSkill": 4.2,
    "avgManner": 4.5
  }
}
```

---

## AI 개발 지침

### 파일 생성 시
1. 기존 구조 확인 후 적절한 위치 선택
2. 파일명은 규칙에 맞게 명명
3. 필수 주석 추가 (파일 목적, 핵심 함수)

### 코드 작성 시
1. React Hooks 활용 (클래스형 X)
2. 함수형 컴포넌트로 작성
3. 한글 주석으로 로직 설명
4. console.log 테스트 코드 제거

### 테스트 전
1. ESLint 검사 수행 (`npm run lint`)
2. 브라우저 콘솔에 에러 확인
3. 모바일 디바이스 시뮬레이터로 반응형 확인

### 커밋 시
1. 파일 경로 명시 (src/components/MatchForm.jsx)
2. 무엇을 했는지 간단히 작성
3. Phase 번호 명시 (Phase 1: 매치 폼 UI 구현)

---

## 자주 참고할 문서

- [요구사항 명세서](../docs/REQUIREMENTS.md) - 기능별 상세 정의
- [코딩 규칙](rules/rule.md) - 컨벤션 & 가이드
- [프로젝트 README](../README.md) - 프로젝트 전체 개요
