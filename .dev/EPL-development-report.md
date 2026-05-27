# EPL 개발 진행 현황 및 이슈 보고서

**프로젝트**: EPL (Easy Pick League) — 아마추어 축구 경기 자동 매칭 플랫폼  
**담당자**: 2205 김태균  
**개발 환경**: React 19.x / Vite 8.x / LocalStorage / macOS

---

## 📌 2차 개발 (2026-05-20)

### Phase 2: 팀 빌딩 알고리즘 통합

| 항목 | 내용 |
|------|------|
| **날짜** | 2026년 5월 20일 (화) |
| **단계** | Phase 2: 지능형 팀 빌딩 알고리즘 통합 |
| **주요 성과** | TeamBuilder 컴포넌트 구현 및 MatchPage 통합 완료 |

---

## 🎓 2차: 학습한 내용 및 활동 결과

### 2-1. Phase 2 팀 빌딩 기능의 구조적 통합

Phase 1에서 구현된 참여자 명단 관리 시스템에 Phase 2의 팀 빌딩 알고리즘을 성공적으로 통합하였다. 기존에 구현되었던 Snake Draft 알고리즘(`snakeDraft.js`)과 학년 가중치 필터(`yearWeighting.js`)를 활용하여, MatchPage 컴포넌트에서 조건부로 TeamBuilder UI를 렌더링하는 통합 구조를 완성하였다. 특히, 경기 상태('모집 중')와 참여자 수(2명 이상) 조건을 검증한 후에만 팀 배정 기능을 활성화함으로써 사용자 경험과 데이터 무결성을 동시에 확보하는 방식을 적용하였다. 이를 통해 사용자는 참여자를 등록하는 즉시 자동으로 생성된 팀 구성을 시각적으로 확인할 수 있게 되었으며, 학년 가중치 조정 및 재배정 버튼을 통해 최적의 팀 조합을 능동적으로 탐색할 수 있는 인터페이스를 제공하게 되었다.

### 2-2. TeamBuilder 컴포넌트의 재사용 가능한 설계 패턴

TeamBuilder 컴포넌트는 props로 받은 참여자 배열만으로 독립적으로 팀 배정 기능을 수행하도록 설계하였으며, 이는 향후 다른 페이지에서도 이 컴포넌트를 재사용할 수 있음을 의미한다. `useMemo`를 활용하여 매개변수(yearWeight, iterations, refreshSeed) 변경 시에만 팀 빌딩 알고리즘을 재실행하도록 최적화하였으므로, 렌더링 시 불필요한 계산을 피할 수 있다. 또한 매개변수가 직관적인 범위(학년 가중치 0~2, 반복 횟수 10~100)로 제한되어 있어 사용자가 시뮬레이션을 통해 팀 배정의 다양한 시나리오를 안전하게 탐색할 수 있다. 컴포넌트 계층 관점에서 보면, 데이터 정규화(skillScore, year를 숫자로 변환) → 알고리즘 실행(`buildBalancedTeams`) → UI 렌더링(Card + List) 순서로 명확히 분리되어 있어 유지보수성이 높다.

### 2-3. MatchPage에서의 조건부 렌더링 및 레이아웃 통합

MatchPage에 TeamBuilder를 통합하면서 레이아웃 구조를 다음과 같이 설계하였다: **참여자 목록 → 팀 빌딩(조건부) → 경기 관리 액션**. 이 순서는 사용자의 정보 처리 흐름과 일치하는데, 참여자들을 먼저 확인한 후 자동으로 생성된 팀 구성을 보고, 필요하면 경기 상태를 변경하는 자연스러운 워크플로우를 유도한다. 조건부 렌더링 로직(`currentMatch.status === 'recruiting' && currentMatch.participants.length >= 2`)은 TeamBuilder를 표시할 최소 요건을 명확히 함으로써, 데이터가 불충분한 상태에서의 오류 가능성을 사전에 차단한다. 또한 경기 상태가 '준비 완료'로 변경되면 TeamBuilder가 자동으로 숨겨지므로, 경기가 진행 중인 상태에서는 팀 구성이 우발적으로 변경되지 않도록 보호된다.

---

## 💻 2차: 소스코드 캡처

### 소스코드 ①: `snakeDraft.js` — Snake Draft 알고리즘

```javascript
// src/utils/snakeDraft.js

const getSnakeTeamIndex = (index) => {
  const pattern = [0, 1, 1, 0];
  return pattern[index % pattern.length];
};

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
```

> **학습 포인트**: [0, 1, 1, 0] 패턴으로 A팀과 B팀에 번갈아 배정하는 방식으로, 직선 드래프트보다 팀의 총 실력을 더 균형있게 만든다.

---

### 소스코드 ②: `yearWeighting.js` — 학년 가중치 밸런스

```javascript
// src/utils/yearWeighting.js

export const getBalanceScore = (teamA, teamB, yearWeight = 0.6) => {
  const totalSkillA = getTotalSkill(teamA);
  const totalSkillB = getTotalSkill(teamB);
  const skillDiff = Math.abs(totalSkillA - totalSkillB);
  
  const yearPenalty = getYearBalancePenalty(teamA, teamB, yearWeight);
  const score = skillDiff + yearPenalty;

  return {
    score,
    skillDiff,
    yearPenalty,
    avgYearA: getAverageYear(teamA),
    avgYearB: getAverageYear(teamB),
    totalSkillA,
    totalSkillB,
  };
};
```

> **학습 포인트**: 밸런스 점수 = `실력 차이 + (학년 차이 × 가중치)`로 실력 균형을 우선하면서 학년 쏠림을 제어한다.

---

### 소스코드 ③: `TeamBuilder.jsx` — UI 컴포넌트

```javascript
// src/components/TeamBuilder.jsx (핵심)

function TeamBuilder({ participants = [] }) {
  const [yearWeight, setYearWeight] = useState(0.6);
  const [iterations, setIterations] = useState(30);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const normalizedParticipants = useMemo(() => {
    return participants.map((p) => ({
      ...p,
      skillScore: Number(p.skillScore || 3),
      year: Number(p.year || 1),
    }));
  }, [participants]);

  const result = useMemo(() => {
    if (normalizedParticipants.length < 2) return null;
    return buildBalancedTeams(normalizedParticipants, {
      yearWeight,
      iterations,
      seed: refreshSeed,
    });
  }, [normalizedParticipants, yearWeight, iterations, refreshSeed]);

  return (
    <div className="team-builder-root">
      <label>
        학년 가중치 ({Number(yearWeight).toFixed(1)})
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={yearWeight}
          onChange={(e) => setYearWeight(Number(e.target.value))}
        />
      </label>

      <Button variant="primary" onClick={() => setRefreshSeed((v) => v + 1)}>
        재배정
      </Button>

      {result && (
        <>
          <Card header={<h3>📊 밸런스 지표</h3>}>
            <div>총 점수: {result.metrics.score.toFixed(2)}</div>
            <div>실력 차이: {result.metrics.skillDiff.toFixed(2)}</div>
            <div>학년 페널티: {result.metrics.yearPenalty.toFixed(2)}</div>
          </Card>
        </>
      )}
    </div>
  );
}
```

> **학습 포인트**: `useMemo`로 계산 비용 높은 알고리즘을 최적화하고, `refreshSeed`로 명시적 재배정만 허용한다.

---

### 소스코드 ④: `MatchPage.jsx` — 통합 구현

```javascript
// src/pages/MatchPage.jsx

import {
  Layout,
  Container,
  MatchForm,
  ParticipantForm,
  ParticipantList,
  MatchActions,
  TeamBuilder,  // Phase 2 추가
} from '../components';

function MatchPage() {
  return (
    <Layout headerProps={headerProps}>
      <Container>
        {currentMatch && (
          <>
            <ParticipantList participants={currentMatch.participants} />

            {currentMatch.status === 'recruiting' && currentMatch.participants.length >= 2 && (
              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <TeamBuilder participants={currentMatch.participants} />
              </div>
            )}

            <MatchActions match={currentMatch} />
          </>
        )}
      </Container>
    </Layout>
  );
}
```

> **학습 포인트**: 조건부 렌더링으로 불필요한 계산을 방지하고, 경기 상태에 따라 기능을 제어한다.

---

### 소스코드 ⑤: `components/index.js` — export 관리

```javascript
// src/components/index.js

// Phase 1
export { default as MatchForm } from './MatchForm';
export { default as ParticipantForm } from './ParticipantForm';
export { default as ParticipantList } from './ParticipantList';
export { default as MatchActions } from './MatchActions';

// Phase 2
export { default as TeamBuilder } from './TeamBuilder';
```

> **학습 포인트**: 컴포넌트 색인으로 공개 인터페이스를 관리하고 내부 구조 변경 영향을 최소화한다.

---

## ⚠️ 2차: 이슈 발생 및 처리

### 이슈 #1: TeamBuilder import 누락 [✅ 해결]

**증상**: `TeamBuilder is not defined` 런타임 오류

**원인**: MatchPage에서 import 문에 TeamBuilder를 추가하지 않음

**해결**: import에 `TeamBuilder` 추가
```javascript
// 수정 전
import { Layout, MatchForm, ParticipantForm, /* TeamBuilder 없음 */ } from '../components';

// 수정 후
import { Layout, MatchForm, ParticipantForm, TeamBuilder } from '../components';
```

**결과**: React DevTools와 브라우저 콘솔에서 오류 완전 제거, 팀 빌딩 섹션 정상 렌더링

---

### 이슈 #2: 참여자 데이터 타입 불일치 [✅ 해결]

**증상**: 밸런스 점수 계산 시 NaN 반환 (학년이 문자열로 인식)

**원인**: HTML input의 반환값이 문자열인데, 타입 변환 불일치

**해결**: `useMemo`로 입력 데이터 정규화
```javascript
const normalizedParticipants = useMemo(() => {
  return participants.map((p) => ({
    ...p,
    skillScore: Number(p.skillScore || 3),
    year: Number(p.year || 1),
  }));
}, [participants]);
```

**결과**: 컴포넌트 계층에서 타입 일관성 확보, 하위 함수는 안정적인 숫자 입력값 받음

---

### 이슈 #3: 팀 배정 결과의 일관성 부족 [✅ 해결]

**증상**: 매개변수 미변경 상태에서도 재렌더링 시 팀 구성이 달라짐

**원인**: `shuffle()` 함수가 매번 다른 결과 생성 (설계 의도)

**해결**: `refreshSeed` 상태 변수로 명시적 재배정만 허용
```javascript
const [refreshSeed, setRefreshSeed] = useState(0);

const result = useMemo(() => {
  return buildBalancedTeams(normalizedParticipants, {
    yearWeight,
    iterations,
    seed: refreshSeed,  // 이 값 변경 시에만 재계산
  });
}, [normalizedParticipants, yearWeight, iterations, refreshSeed]);

<Button onClick={() => setRefreshSeed((v) => v + 1)}>재배정</Button>
```

**결과**: '재배정' 버튼 클릭 시에만 새 조합 생성, 슬라이더 조정은 즉시 반응하면서 계산 횟수 제어

---

### 이슈 #4: 조건부 렌더링 부재 [✅ 해결]

**증상**: 참여자 1명 이하일 때도 TeamBuilder 렌더링되어 불필요한 계산 발생

**원인**: MatchPage에서 조건 검사 없이 항상 TeamBuilder 렌더링

**해결**: 부모 컴포넌트에서 렌더링 조건 추가
```javascript
{currentMatch.status === 'recruiting' && currentMatch.participants.length >= 2 && (
  <TeamBuilder participants={currentMatch.participants} />
)}
```

**결과**: 
- 참여자 2명 미만 시 TeamBuilder 미렌더링
- 경기 상태가 '준비 완료'로 변경되면 자동 숨김
- 불필요한 메모리 사용 및 계산 방지

---

### 이슈 #5: 팀 배정 결과의 영속성 부재 [⚠️ 진행 중]

**증상**: 페이지 새로고침 시 팀 구성 데이터 소실 (메모리에만 존재)

**원인**: TeamBuilder가 실시간 계산만 수행하고 LocalStorage 저장 기능 없음

**영향도**: 높음 - Phase 3/4에서 팀 정보 필요

**예정 해결 방법**:
```javascript
// 1. useMatchData 훅에 팀 저장 함수 추가
const saveTeamAssignment = (matchId, { teamA, teamB, metrics }) => {
  setMatches((prev) =>
    prev.map((match) =>
      match.id === matchId
        ? { ...match, teamAssignment: { teamA, teamB, metrics, savedAt: new Date().toISOString() } }
        : match
    )
  );
};

// 2. TeamBuilder에 '팀 구성 확정' 버튼 추가
<Button variant="success" onClick={() => {
  saveTeamAssignment(currentMatch.id, result);
}}>
  팀 구성 확정
</Button>

// 3. 경기 상태 변경 시 팀 구성 잠금
```

**다음 사이클 처리 예정**

---

## 🔄 2차: 고찰 및 추후 개발 계획

### 2-1. 고찰

Phase 2 개발을 통해 복잡한 비즈니스 로직(팀 빌딩 알고리즘)을 리액트 컴포넌트 계층과 명확히 분리하는 방식의 중요성을 재확인하였다. `snakeDraft.js`와 `yearWeighting.js`는 순수 JavaScript 함수로만 이루어져 있어서, React와 무관하게 테스트하고 재사용할 수 있으며 이는 코드 품질을 높인다. 또한 `useMemo`를 통한 메모이제이션은 팀 빌딩 알고리즘의 높은 계산 비용을 감안할 때 매우 효과적이었다. 한편, 현재 구현에서는 팀 배정 결과를 LocalStorage에 저장하지 않고 있어, 페이지 새로고침 시 팀 구성이 사라지는 한계가 있다. 향후에는 사용자가 '팀 구성 확정' 버튼으로 경기에 팀 정보를 저장하고, 이를 Phase 3 전술 배치도와 Phase 4 별점 리뷰 단계에서 활용하는 방식으로 개선할 필요가 있다. 또한 반복 횟수(iterations)를 과도하게 크게 설정하면 브라우저 UI가 일시적으로 응답하지 않을 수 있으므로, 비동기 처리나 Web Worker를 도입하는 최적화도 고려해볼 만하다.

### 2-2. 추후 개발 계획

| 우선순위 | 작업 | 영향도 | 예상 시간 |
|----------|------|--------|----------|
| 🔴 긴급 | 팀 배정 결과 LocalStorage 저장 | 높음 | 1시간 |
| 🟠 높음 | '팀 구성 확정' 버튼 구현 | 높음 | 1시간 |
| 🟠 높음 | Phase 3 — 전술 배치도(dnd-kit) | 높음 | 4시간 |
| 🟡 중간 | 팀 빌딩 비동기 처리 (Web Worker) | 중간 | 2시간 |
| 🟡 중간 | 팀 빌딩 히스토리 저장/비교 | 중간 | 1.5시간 |
| 🟢 낮음 | 알고리즘 유닛 테스트 | 낮음 | 2시간 |

---

**마지막 업데이트**: 2026년 5월 20일  
**다음 개발**: Phase 3 — 드래그 앤 드롭 전술 배치도 (예정 2026-05-21)
