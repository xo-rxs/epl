# 개발 계획서 — Phase 3 드래그 앤 드롭 전술 배치도

**프로젝트**: EPL (Easy Pick League) — 아마추어 축구 경기 자동 매칭 플랫폼  
**담당자**: 2205 김태균  
**개발 환경**: React 19.x / Vite 8.x / LocalStorage / macOS

---

## 📌 3차 개발 (예정)

### Phase 3: 드래그 앤 드롭 전술 배치도

| 항목 | 내용 |
|------|------|
| **예정 날짜** | 2026년 5월 21일 (수) |
| **단계** | Phase 3: 드래그 앤 드롭 전술 포지션 배치도 |
| **주요 목표** | dnd-kit 기반 축구장 UI 구현 및 이미지 저장/공유 기능 |

---

## 🎯 3차: 예정 작업 내용

### 3-1. 축구장 전술 배치도 UI

**목표**: SVG 또는 Canvas 기반 축구장 UI 구현  
**구현 파일**: 
- `src/components/TacticsBoard.jsx` — 전술 배치도 메인 컴포넌트
- `src/components/SoccerField.jsx` — 축구장 SVG UI 컴포넌트

**예정 기능**:
- ⚽ SVG로 축구장 그리기 (필드, 라인, 영역 표시)
- 👥 팀 A/B 선수 아이콘 배치
- 🏷️ 포지션 라벨(GK, CB, LB, RB, CM, LM, RM, ST 등)
- 📊 팀 별 평균 실력 표시

**기술 스택**:
- SVG (축구장 벡터 그래픽)
- React 컴포넌트 (레이아웃 관리)
- CSS 그리드/플렉스 (반응형 배치)

---

### 3-2. 드래그 앤 드롭 상호작용

**목표**: dnd-kit 라이브러리로 모바일/웹 드래그 지원  
**구현 파일**: `src/components/PlayerDraggable.jsx`

**예정 기능**:
- 🖱️ 마우스 드래그 (데스크톱)
- 📱 터치 드래그 (모바일)
- 자동 스냅(포지션 격자에 맞춤)
- 실시간 포지션 라벨 업데이트
- 드래그 중 시각적 피드백 (하이라이트, 스냅 위치 표시)

**구현 계획**:
1. dnd-kit 라이브러리 설치 및 초기화
2. DndContext, Droppable, Draggable 컴포넌트 설정
3. 포지션별 드롭 영역 정의 (GK, CB, LB, RB, CM, LM, RM, ST)
4. 터치 이벤트 핸들러 추가 (모바일 지원)
5. 드래그 완료 후 상태 저장

**기술 스택**:
- `dnd-kit` (드래그 앤 드롭)
- `@dnd-kit/utilities` (유틸리티)
- `@dnd-kit/core` (핵심 기능)

---

### 3-3. 이미지 저장 및 공유

**목표**: html2canvas로 배치도 이미지 생성  
**구현 파일**: `src/utils/imageExport.js`

**예정 기능**:
- 📸 PNG 이미지로 캡처
- 📥 로컬 다운로드
- 📤 카카오톡/인스타그램 공유 링크 생성
- 다양한 해상도 지원 (모바일/데스크톱)

**구현 계획**:
1. html2canvas로 축구장 배치도 요소를 PNG로 변환
2. 다운로드 링크 생성 및 트리거
3. 공유 버튼 UI 구현 (카카오톡, 인스타그램 등)
4. 이미지 메타데이터 추가 (경기명, 팀명, 날짜 등)

**기술 스택**:
- `html2canvas` (이미지 캡처)
- `Blob API` (파일 생성)
- `navigator.share` (네이티브 공유, 모바일)
- URL.createObjectURL (다운로드 링크)

---

## 📊 3차: 예상 이슈 및 대응 방안

| 예상 이슈 | 심각도 | 대응 방안 |
|----------|--------|---------|
| 드래그 성능 저하 | 중간 | dnd-kit의 smooth 애니메이션 설정 조정, 불필요한 리렌더링 방지 via useMemo |
| 모바일 터치 이벤트 충돌 | 중간 | dnd-kit의 touchBehavior 설정으로 스크롤과 드래그 구분 |
| 이미지 화질 손상 | 낮음 | html2canvas DPI/scale 설정으로 고해상도 캡처 (scale: 2) |
| SVG 브라우저 호환성 | 낮음 | IE 미지원 공지, 모던 브라우저 대상 (Chrome, Firefox, Safari) |
| 드래그 드롭 데이터 소실 | 높음 | 드래그 완료 후 State 즉시 저장, LocalStorage 연동 고려 |

---

## 📅 3차: 예상 일정 및 마일스톤

| 항목 | 예상 시간 | 상태 | 담당 |
|------|----------|------|------|
| **3-1**: 축구장 UI 구현 | 1시간 | ⏳ 예정 | 김태균 |
| **3-2**: dnd-kit 통합 | 2시간 | ⏳ 예정 | 김태균 |
| **3-3**: 이미지 저장/공유 | 1시간 | ⏳ 예정 | 김태균 |
| **테스트 및 최적화** | 1시간 | ⏳ 예정 | 김태균 |
| **총 예상 시간** | **5시간** | ⏳ 예정 | - |

**마일스톤**:
- 11:00 ~ 12:00: 축구장 SVG UI 완성 및 선수 배치
- 12:00 ~ 14:00: dnd-kit 드래그 드롭 통합 및 테스트
- 14:00 ~ 15:00: html2canvas 이미지 저장/공유 기능 구현
- 15:00 ~ 16:00: 통합 테스트, 최적화, 문제 수정

---

## 🔗 3차: 선행 조건 (Phase 2 완료 필요)

**필수 조건**:
- [x] TeamBuilder 컴포넌트 완료
- [x] 팀 배정 알고리즘 검증
- ⏳ 팀 배정 결과 LocalStorage 저장 (이슈 #5 처리)
  - 예: `match.teamAssignment = { teamA, teamB, metrics, savedAt }`
- ⏳ '팀 구성 확정' 버튼 구현 (필수는 아니지만 권장)

**권장 사항**:
- Phase 2 고찰 리뷰 (특히 useMemo 최적화 패턴)
- dnd-kit 공식 문서 사전 읽기
- html2canvas 버전 확인 (최신 버전 설치)

---

## 📦 3차: 필요 라이브러리 설치

```bash
# dnd-kit 라이브러리 설치
npm install @dnd-kit/core @dnd-kit/utilities

# html2canvas 설치
npm install html2canvas

# (선택) 터치 이벤트 개선
npm install @dnd-kit/touch-events
```

---

## 💡 3차: 기술 고려사항

### SVG 축구장 설계
```
너비: 1200px / 높이: 800px (16:10.67 비율, 축구장 11:7 비율 근접)
센터라인: 600px (중앙)
골라인: 각 가장자리
페널티 박스: 좌우 180px × 480px
골키퍼 에어리어: 좌우 60px × 360px
포지션 그리드: 각 팀 4x2 배치 가능
```

### 포지션 정의
```
GK (골키퍼): 골라인에 가깝게
CB (센터백): 2명 배치, 센터라인 뒤쪽
LB/RB (측면수비수): 양측면
CM (미드필더): 센터라인 중앙
LM/RM (양측 미드필더): 양측면 전방
ST (스트라이커): 센터라인 전방
```

### dnd-kit 설정 예시
```javascript
<DndContext
  sensors={[MouseSensor, TouchSensor]}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <Droppable id="GK-zone">...</Droppable>
  <Droppable id="CB-zone">...</Droppable>
  {/* ... 다른 포지션 */}
</DndContext>
```

---

## 📋 3차: 개발 체크리스트

### 사전 준비
- [ ] Phase 2 이슈 #5 해결 (팀 배정 결과 저장)
- [ ] dnd-kit 라이브러리 설치 및 버전 확인
- [ ] html2canvas 라이브러리 설치 및 버전 확인
- [ ] Figma/스케치에 축구장 레이아웃 설계

### 축구장 UI (3-1)
- [ ] SoccerField.jsx 컴포넌트 생성
- [ ] SVG 축구장 그리기 (필드, 라인, 영역)
- [ ] 포지션별 드롭 존 정의
- [ ] 선수 아이콘 배치
- [ ] 포지션 라벨 추가
- [ ] 반응형 디자인 적용

### 드래그 드롭 (3-2)
- [ ] TacticsBoard.jsx 컴포넌트 생성
- [ ] dnd-kit DndContext 설정
- [ ] PlayerDraggable.jsx 드래그 가능 컴포넌트 생성
- [ ] 포지션별 Droppable 설정
- [ ] 드래그 완료 이벤트 핸들러 구현
- [ ] 터치 이벤트 지원 추가
- [ ] 시각적 피드백 (드래그 중 하이라이트)

### 이미지 저장/공유 (3-3)
- [ ] imageExport.js 유틸 함수 생성
- [ ] html2canvas 이미지 캡처 함수
- [ ] 다운로드 버튼 UI 추가
- [ ] 공유 버튼 UI 추가 (카카오톡, 인스타그램)
- [ ] 이미지 메타데이터 추가
- [ ] 모바일 공유 API (navigator.share) 지원

### 테스트 및 최적화
- [ ] 브라우저 호환성 테스트 (Chrome, Firefox, Safari)
- [ ] 모바일 터치 테스트
- [ ] 드래그 성능 최적화
- [ ] 이미지 화질 확인
- [ ] 반응형 레이아웃 테스트
- [ ] LocalStorage 통합 테스트

### 문서화
- [ ] 개발 일지 작성 (학습 내용 + 소스코드 캡처)
- [ ] 이슈 처리 보고서 작성
- [ ] 코드 주석 및 JSDoc 추가

---

## 🔄 3차 이후 계획 (Phase 4)

### Phase 4: 경기 후 상호 별점 리뷰 시스템
- 별점 평가 UI (1-5점)
- 사용자 프로필 페이지
- Chart.js 레이더 차트 시각화
- 누적 평가 데이터 관리

---

## 📌 주요 용어 정리

| 용어 | 설명 |
|------|------|
| **dnd-kit** | 현대적인 드래그 앤 드롭 라이브러리, 모바일 지원 우수 |
| **html2canvas** | DOM 요소를 PNG/JPEG 이미지로 변환하는 라이브러리 |
| **SVG** | 스케일러블 벡터 그래픽 (축구장 UI 구현) |
| **Droppable** | dnd-kit에서 드롭 가능한 영역 정의 컴포넌트 |
| **Draggable** | dnd-kit에서 드래그 가능한 아이템 정의 컴포넌트 |
| **DndContext** | dnd-kit의 모든 드래그 드롭 기능을 관리하는 컨텍스트 |
| **TouchSensor** | dnd-kit의 터치 이벤트 핸들러 |
| **closestCenter** | dnd-kit의 충돌 감지 전략 (가장 가까운 중심점) |

---

**예정 시작**: 2026년 5월 21일  
**예상 완료**: 2026년 5월 21일 16:00  
**다음 단계**: Phase 4 별점 리뷰 시스템 (예정 2026-05-22)
