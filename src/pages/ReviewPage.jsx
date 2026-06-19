import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Container, Button } from '../components';
import { useAuthData, useMatchData } from '../hooks';
import { addReviewPoints, REVIEW_REWARD_POINTS, MOM_SKILL_POINTS, MOM_MANNER_POINTS } from '../utils/reviewPoints';
import '../styles/ReviewPage.css';

const getStatus = (p) => p.status || 'approved';

// 평가자 식별용 익명 키 생성 (원본 사용자 ID를 평가 데이터에 남기지 않기 위한 단방향 해시)
const toAnonymousKey = (userId) => {
  let hash = 5381;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 33) ^ userId.charCodeAt(i);
  }
  return `anon_${(hash >>> 0).toString(16)}`;
};

const REVIEW_TAGS = {
  positive: [
    { label: '매너가 좋아요' },
    { label: '실력이 좋아요' },
    { label: '시간 약속을 잘 지켜요' },
    { label: '소통이 잘 돼요' },
    { label: '팀플레이가 좋아요' },
    { label: '분위기가 좋아요' },
  ],
  negative: [
    { label: '매너가 별로에요' },
    { label: '실력이 아쉬워요' },
    { label: '시간 약속이 아쉬워요' },
    { label: '소통이 아쉬워요' },
    { label: '팀플레이가 아쉬워요' },
  ],
};

// 기본값 ★3으로 초기화 (미터치 상태)
const buildInitialEntries = (participants, existingEntries = []) => {
  const map = {};
  existingEntries.forEach((e) => {
    map[e.participantId] = {
      rating: e.rating || 3,
      skillRating: e.skillRating || 3,
      tags: e.tags || [],
      touched: true,
    };
  });
  participants.forEach((p) => {
    if (!map[p.id]) map[p.id] = { rating: 3, skillRating: 3, tags: [], touched: false };
  });
  return map;
};

const isFullyRated = (entry) => entry?.rating > 0 && entry?.skillRating > 0;

/* 별점 한 줄 (실력/매너 공용) */
function StarRow({ label, value, onSelect }) {
  return (
    <div className="rv-rate-row">
      <span className="rv-rate-label">{label}</span>
      <div className="rv-stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={`rv-star ${value >= score ? 'is-active' : ''}`}
            aria-pressed={value === score}
            onClick={() => onSelect(score)}
          >
            ★
          </button>
        ))}
        {value > 0 && <span className="rv-star-label">{value}점</span>}
      </div>
    </div>
  );
}

/* 개별 선수 평가 카드 */
function ReviewCard({ participant, entry, onRate, onToggleTag, cardRef }) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const touched = entry.touched;
  const rated = isFullyRated(entry);

  const handleRate = (field, score) => {
    onRate(participant.id, field, score);
    if (!tagsOpen) setTagsOpen(true);
  };

  return (
    <div
      ref={cardRef}
      className={['rv-card', touched && rated ? 'is-done' : '', !touched ? 'is-fresh' : ''].filter(Boolean).join(' ')}
    >
      {/* 선수 정보 */}
      <div className="rv-card__top">
        <div className="rv-card__info">
          <span className="rv-card__name">{participant.name}</span>
          <span className="rv-card__meta">
            {participant.age ? `${participant.age}세` : `${participant.year}학년`}
            {' · '}{participant.position}
          </span>
        </div>
        {touched && rated && (
          <div className="rv-card__done-badge">
            실력 ★{entry.skillRating} · 매너 ★{entry.rating}
          </div>
        )}
        {!touched && (
          <div className="rv-card__default-badge">기본값 ★3</div>
        )}
      </div>

      {/* 실력 / 매너 별점 */}
      <StarRow
        label="실력"
        value={entry.skillRating}
        onSelect={(score) => handleRate('skillRating', score)}
      />
      <StarRow
        label="매너"
        value={entry.rating}
        onSelect={(score) => handleRate('rating', score)}
      />

      {/* 태그 (별점 선택 후 펼쳐짐) */}
      {touched && (entry.rating > 0 || entry.skillRating > 0) && (
        <div className="rv-tags-section">
          <button
            type="button"
            className="rv-tags-toggle"
            onClick={() => setTagsOpen((v) => !v)}
          >
            <span>태그 선택 {entry.tags.length > 0 ? `(${entry.tags.length}개)` : '(선택사항)'}</span>
            <span className="rv-tags-toggle__arrow">{tagsOpen ? '▲' : '▼'}</span>
          </button>
          {tagsOpen && (
            <div className="rv-tags">
              <div className="rv-tags__group">
                {REVIEW_TAGS.positive.map((tag) => {
                  const key = tag.label;
                  const active = entry.tags.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`rv-tag rv-tag--pos ${active ? 'is-active' : ''}`}
                      onClick={() => onToggleTag(participant.id, key)}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              <div className="rv-tags__group">
                {REVIEW_TAGS.negative.map((tag) => {
                  const key = tag.label;
                  const active = entry.tags.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`rv-tag rv-tag--neg ${active ? 'is-active' : ''}`}
                      onClick={() => onToggleTag(participant.id, key)}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* MOM 선택 섹션 */
function MomSection({ participants, skillMom, mannerMom, onSelectSkillMom, onSelectMannerMom }) {
  return (
    <div className="rv-mom-section">
      <h3 className="rv-mom-title">Man of the Match</h3>
      <p className="rv-mom-desc">오늘 경기에서 가장 빛났던 팀원을 선택해주세요. (선택사항)</p>

      <div className="rv-mom-row">
        <div className="rv-mom-label">
          <span className="rv-mom-label__icon">⚽</span>
          <span>실력 MOM</span>
          {skillMom && <span className="rv-mom-points-hint">선정 시 +{MOM_SKILL_POINTS}P</span>}
        </div>
        <div className="rv-mom-grid">
          {participants.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`rv-mom-btn ${skillMom === p.id ? 'is-active' : ''}`}
              onClick={() => onSelectSkillMom(skillMom === p.id ? null : p.id)}
            >
              <span className="rv-mom-btn__name">{p.name}</span>
              <span className="rv-mom-btn__pos">{p.position}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rv-mom-row">
        <div className="rv-mom-label">
          <span className="rv-mom-label__icon">🤝</span>
          <span>매너 MOM</span>
          {mannerMom && <span className="rv-mom-points-hint">선정 시 +{MOM_MANNER_POINTS}P</span>}
        </div>
        <div className="rv-mom-grid">
          {participants.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`rv-mom-btn ${mannerMom === p.id ? 'is-active' : ''}`}
              onClick={() => onSelectMannerMom(mannerMom === p.id ? null : p.id)}
            >
              <span className="rv-mom-btn__name">{p.name}</span>
              <span className="rv-mom-btn__pos">{p.position}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewPage() {
  const { matches, updateMatch } = useMatchData();
  const { currentUser } = useAuthData();
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [entries, setEntries] = useState({});
  const [skillMom, setSkillMom] = useState(null);
  const [mannerMom, setMannerMom] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const cardRefs = useRef({});

  const reviewerKey = currentUser ? toAnonymousKey(currentUser.id) : null;

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const myReview = useMemo(() => {
    if (!selectedMatch || !reviewerKey) return null;
    return selectedMatch.reviewsByUser?.[reviewerKey] || null;
  }, [selectedMatch, reviewerKey]);

  // 내가 속한 팀 찾기 (teamAssignment 있을 때만)
  const myTeamParticipants = useMemo(() => {
    if (!selectedMatch || !currentUser) return null;
    const ta = selectedMatch.teamAssignment;
    if (!ta) return null;

    const myParticipant = (selectedMatch.participants || []).find(
      (p) => p.userId === currentUser.id
    );
    if (!myParticipant) return null;

    const inTeamA = (ta.teamA || []).some((p) => p.id === myParticipant.id);
    const inTeamB = (ta.teamB || []).some((p) => p.id === myParticipant.id);
    if (!inTeamA && !inTeamB) return null;

    const myTeam = inTeamA ? ta.teamA : ta.teamB;
    // 같은 팀에서 본인 제외
    return myTeam.filter((p) => p.userId !== currentUser.id);
  }, [selectedMatch, currentUser]);

  // 팀 배정 있으면 팀원만, 없으면 전원 표시 (fallback)
  const reviewTargets = useMemo(() => {
    if (!selectedMatch) return [];
    const all = (selectedMatch.participants || []).filter(
      (p) => getStatus(p) === 'approved' && p.userId !== currentUser?.id
    );
    if (myTeamParticipants !== null) return myTeamParticipants;
    return all;
  }, [selectedMatch, currentUser, myTeamParticipants]);

  const isTeamFiltered = myTeamParticipants !== null;

  useEffect(() => {
    if (!selectedMatch) { setEntries({}); setSkillMom(null); setMannerMom(null); return; }
    setEntries(buildInitialEntries(reviewTargets, myReview?.entries || []));
    setSkillMom(myReview?.skillMom || null);
    setMannerMom(myReview?.mannerMom || null);
  }, [reviewTargets, selectedMatch, myReview]);

  const touchedCount = useMemo(
    () => reviewTargets.filter((p) => entries[p.id]?.touched).length,
    [reviewTargets, entries]
  );

  /* 별점 선택 → 실력·매너 모두 매기면 다음 미터치 선수로 자동 스크롤 */
  const handleRate = useCallback((participantId, field, score) => {
    setEntries((prev) => ({
      ...prev,
      [participantId]: { ...prev[participantId], [field]: score, touched: true },
    }));

    const updatedEntry = { ...entries[participantId], [field]: score };
    if (!isFullyRated(updatedEntry)) return;

    const idx = reviewTargets.findIndex((p) => p.id === participantId);
    const nextUntouched = reviewTargets.slice(idx + 1).find(
      (p) => !entries[p.id]?.touched
    );
    if (nextUntouched) {
      setTimeout(() => {
        cardRefs.current[nextUntouched.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [reviewTargets, entries]);

  const handleToggleTag = useCallback((participantId, tag) => {
    setEntries((prev) => {
      const tags = prev[participantId]?.tags || [];
      return {
        ...prev,
        [participantId]: {
          ...prev[participantId],
          tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
          touched: true,
        },
      };
    });
  }, []);

  // 전체 무난: 모든 항목을 기본값 ★3으로 초기화
  const handleAllDefault = useCallback(() => {
    setEntries((prev) => {
      const next = { ...prev };
      reviewTargets.forEach((p) => {
        next[p.id] = { rating: 3, skillRating: 3, tags: [], touched: false };
      });
      return next;
    });
    setSkillMom(null);
    setMannerMom(null);
  }, [reviewTargets]);

  const handleSave = () => {
    if (!selectedMatch || !currentUser || !reviewerKey) return;

    const reviewEntries = reviewTargets.map((p) => {
      const e = entries[p.id] || { rating: 3, skillRating: 3, tags: [] };
      return {
        participantId: p.id,
        name: p.name,
        age: p.age,
        position: p.position,
        rating: Number(e.rating) || 3,
        skillRating: Number(e.skillRating) || 3,
        tags: e.tags || [],
      };
    });

    const isFirstSave = !myReview;
    updateMatch(selectedMatch.id, {
      reviewsByUser: {
        ...(selectedMatch.reviewsByUser || {}),
        [reviewerKey]: {
          createdAt: new Date().toISOString(),
          entries: reviewEntries,
          skillMom: skillMom || null,
          mannerMom: mannerMom || null,
        },
      },
    });

    // 첫 저장 시에만 포인트 적립
    if (isFirstSave) {
      addReviewPoints(currentUser.id, REVIEW_REWARD_POINTS);

      // MOM 수신자에게 포인트 지급
      if (skillMom) {
        const momParticipant = (selectedMatch.participants || []).find((p) => p.id === skillMom);
        if (momParticipant?.userId) addReviewPoints(momParticipant.userId, MOM_SKILL_POINTS);
      }
      if (mannerMom) {
        const momParticipant = (selectedMatch.participants || []).find((p) => p.id === mannerMom);
        if (momParticipant?.userId) addReviewPoints(momParticipant.userId, MOM_MANNER_POINTS);
      }

      const momMsg = [skillMom && '실력 MOM', mannerMom && '매너 MOM'].filter(Boolean).join(' · ');
      setSavedMsg(`평가가 익명으로 저장되었습니다. +${REVIEW_REWARD_POINTS}P 적립${momMsg ? ` · ${momMsg} 선정 완료` : ''}`);
    } else {
      setSavedMsg('평가가 익명으로 수정 저장되었습니다.');
    }
    setTimeout(() => setSavedMsg(''), 5000);
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/' },
      { label: '경기', href: '/?page=match' },
      { label: '일정', href: '/?page=schedule' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews', active: true },
      { label: '마이페이지', href: '/?page=auth' },
    ],
  };

  if (!currentUser) {
    return (
      <Layout headerProps={headerProps}>
        <Container>
          <div className="rv-empty">
            <p>
              평가는 로그인 후 참여할 수 있습니다.
              <br />
              평가 내용은 익명으로 저장되며, 평가 완료 시 {REVIEW_REWARD_POINTS}P가 적립됩니다.
            </p>
            <Button
              variant="primary"
              onClick={() => { window.location.href = '/?page=auth'; }}
            >
              로그인하기
            </Button>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <Container>
        {/* 페이지 헤더 */}
        <div className="rv-page-header">
          <div>
            <h2 className="rv-page-title">경기 평가</h2>
            <p className="rv-page-desc">
              {isTeamFiltered
                ? '같은 팀 팀원만 평가합니다. '
                : ''}
              <strong>실력</strong>과 <strong>매너</strong>를 따로 평가합니다.
              기본값은 ★3이며, 평가 완료 시 {REVIEW_REWARD_POINTS}P가 적립됩니다.
            </p>
          </div>
        </div>

        {savedMsg && (
          <div className="rv-toast">
            <span>{savedMsg}</span>
            <button
              type="button"
              className="rv-toast__link"
              onClick={() => { window.location.href = '/?page=auth'; }}
            >
              마이페이지에서 확인 →
            </button>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="rv-empty">
            <p>먼저 경기를 생성하고 참여자를 승인해주세요.</p>
          </div>
        ) : (
          <div className="rv-body">
            {/* 경기 선택 */}
            <div className="rv-match-select">
              <label className="rv-select-label">경기 선택</label>
              <div className="rv-select-wrap">
                <select
                  className="rv-select"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                >
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.participants.length}/{m.maxParticipants})
                    </option>
                  ))}
                </select>
                <span className="rv-select-icon">▾</span>
              </div>
            </div>

            {selectedMatch && reviewTargets.length > 0 && (
              <>
                {/* 팀 필터 안내 */}
                {isTeamFiltered && (
                  <div className="rv-team-notice">
                    같은 팀 {reviewTargets.length}명만 평가합니다
                  </div>
                )}

                {/* 진행률 */}
                <div className="rv-progress">
                  <div className="rv-progress__top">
                    <span className="rv-progress__label">직접 수정</span>
                    <span className="rv-progress__count">
                      {touchedCount} / {reviewTargets.length}명
                    </span>
                  </div>
                  <div className="rv-progress__bar">
                    <div
                      className="rv-progress__fill"
                      style={{ width: `${(touchedCount / reviewTargets.length) * 100}%` }}
                    />
                  </div>
                  {myReview?.createdAt && (
                    <span className="rv-progress__saved">
                      내 평가 마지막 저장: {new Date(myReview.createdAt).toLocaleString('ko-KR')}
                    </span>
                  )}
                </div>

                {/* 선수 카드 목록 */}
                <div className="rv-list">
                  {reviewTargets.map((p) => (
                    <ReviewCard
                      key={p.id}
                      participant={p}
                      entry={entries[p.id] || { rating: 3, skillRating: 3, tags: [], touched: false }}
                      onRate={handleRate}
                      onToggleTag={handleToggleTag}
                      cardRef={(el) => { cardRefs.current[p.id] = el; }}
                    />
                  ))}
                </div>

                {/* MOM 선택 */}
                <MomSection
                  participants={reviewTargets}
                  skillMom={skillMom}
                  mannerMom={mannerMom}
                  onSelectSkillMom={setSkillMom}
                  onSelectMannerMom={setMannerMom}
                />

                {/* 저장 */}
                <div className="rv-save-bar">
                  <button
                    type="button"
                    className="rv-all-default-btn"
                    onClick={handleAllDefault}
                  >
                    전체 무난 (★3 초기화)
                  </button>
                  <Button variant="primary" onClick={handleSave}>
                    {touchedCount === reviewTargets.length ? '평가 완료' : '저장하기'}
                  </Button>
                </div>
              </>
            )}

            {selectedMatch && reviewTargets.length === 0 && (
              <div className="rv-empty">
                <p>평가할 수 있는 참여자가 없습니다. (본인은 평가 대상에서 제외됩니다)</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default ReviewPage;
