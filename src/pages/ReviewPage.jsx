import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, Container, Button } from '../components';
import { useMatchData } from '../hooks';
import '../styles/ReviewPage.css';

const getStatus = (p) => p.status || 'approved';

const REVIEW_TAGS = {
  positive: [
    { label: '매너가 좋아요', emoji: '👍' },
    { label: '실력이 좋아요', emoji: '⭐' },
    { label: '시간 약속을 잘 지켜요', emoji: '⏱️' },
    { label: '소통이 잘 돼요', emoji: '💬' },
    { label: '팀플레이가 좋아요', emoji: '🤝' },
    { label: '분위기가 좋아요', emoji: '😄' },
  ],
  negative: [
    { label: '매너가 별로에요', emoji: '😠' },
    { label: '실력이 아쉬워요', emoji: '😕' },
    { label: '시간 약속이 아쉬워요', emoji: '⏰' },
    { label: '소통이 아쉬워요', emoji: '😶' },
    { label: '팀플레이가 아쉬워요', emoji: '🙅' },
  ],
};

const buildInitialEntries = (participants, existingEntries = []) => {
  const map = {};
  existingEntries.forEach((e) => {
    map[e.participantId] = { rating: e.rating, tags: e.tags || [], touched: true };
  });
  participants.forEach((p) => {
    if (!map[p.id]) map[p.id] = { rating: 0, tags: [], touched: false };
  });
  return map;
};

/* 개별 선수 평가 카드 */
function ReviewCard({ participant, entry, onRate, onToggleTag, cardRef }) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const touched = entry.touched;
  const rated = entry.rating > 0;

  const handleRate = (score) => {
    onRate(participant.id, score);
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
          <span className="rv-card__name">{participant.name || participant.nickname}</span>
          <span className="rv-card__meta">
            {participant.age ? `${participant.age}세` : `${participant.year}학년`}
            {' · '}{participant.position}
          </span>
        </div>
        {rated && (
          <div className="rv-card__done-badge">
            {'★'.repeat(entry.rating)}
            {'☆'.repeat(5 - entry.rating)}
          </div>
        )}
      </div>

      {/* 별점 */}
      <div className="rv-stars" role="radiogroup" aria-label="평점">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={`rv-star ${entry.rating >= score ? 'is-active' : ''}`}
            aria-pressed={entry.rating === score}
            onClick={() => handleRate(score)}
          >
            ★
          </button>
        ))}
        {rated && <span className="rv-star-label">{entry.rating}점</span>}
      </div>

      {/* 태그 (별점 선택 후 펼쳐짐) */}
      {rated && (
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
                  const key = `${tag.emoji} ${tag.label}`;
                  const active = entry.tags.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`rv-tag rv-tag--pos ${active ? 'is-active' : ''}`}
                      onClick={() => onToggleTag(participant.id, key)}
                    >
                      {tag.emoji} {tag.label}
                    </button>
                  );
                })}
              </div>
              <div className="rv-tags__group">
                {REVIEW_TAGS.negative.map((tag) => {
                  const key = `${tag.emoji} ${tag.label}`;
                  const active = entry.tags.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`rv-tag rv-tag--neg ${active ? 'is-active' : ''}`}
                      onClick={() => onToggleTag(participant.id, key)}
                    >
                      {tag.emoji} {tag.label}
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

function ReviewPage() {
  const { matches, updateMatch } = useMatchData();
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [entries, setEntries] = useState({});
  const [savedMsg, setSavedMsg] = useState('');
  const cardRefs = useRef({});

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const approvedParticipants = useMemo(() => {
    if (!selectedMatch) return [];
    return (selectedMatch.participants || []).filter((p) => getStatus(p) === 'approved');
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) { setEntries({}); return; }
    setEntries(buildInitialEntries(approvedParticipants, selectedMatch.reviews?.entries || []));
  }, [approvedParticipants, selectedMatch]);

  const ratedCount = useMemo(
    () => approvedParticipants.filter((p) => entries[p.id]?.rating > 0).length,
    [approvedParticipants, entries]
  );

  /* 별점 선택 → 다음 미평가 선수로 자동 스크롤 */
  const handleRate = useCallback((participantId, score) => {
    setEntries((prev) => ({
      ...prev,
      [participantId]: { ...prev[participantId], rating: score, touched: true },
    }));

    // 다음 미평가 선수 찾기
    const idx = approvedParticipants.findIndex((p) => p.id === participantId);
    const nextUnrated = approvedParticipants.slice(idx + 1).find(
      (p) => !(entries[p.id]?.rating > 0)
    );
    if (nextUnrated) {
      setTimeout(() => {
        cardRefs.current[nextUnrated.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [approvedParticipants, entries]);

  const handleToggleTag = useCallback((participantId, tag) => {
    setEntries((prev) => {
      const tags = prev[participantId]?.tags || [];
      return {
        ...prev,
        [participantId]: {
          ...prev[participantId],
          tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
        },
      };
    });
  }, []);

  const handleSave = () => {
    if (!selectedMatch) return;
    const reviewEntries = approvedParticipants.map((p) => {
      const e = entries[p.id] || { rating: 0, tags: [] };
      return {
        participantId: p.id,
        nickname: p.name || p.nickname,
        age: p.age,
        position: p.position,
        rating: Number(e.rating) || 0,
        tags: e.tags || [],
      };
    });
    updateMatch(selectedMatch.id, {
      reviews: { createdBy: 'host', createdAt: new Date().toISOString(), entries: reviewEntries },
    });
    setSavedMsg('평가가 저장되었습니다! ✅');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/' },
      { label: '경기', href: '/?page=match' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews', active: true },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container>
        {/* 페이지 헤더 */}
        <div className="rv-page-header">
          <div>
            <h2 className="rv-page-title">경기 평가</h2>
            <p className="rv-page-desc">별점을 클릭하면 다음 선수로 자동으로 넘어갑니다.</p>
          </div>
        </div>

        {savedMsg && <div className="rv-toast">{savedMsg}</div>}

        {matches.length === 0 ? (
          <div className="rv-empty">
            <span>📋</span>
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

            {selectedMatch && approvedParticipants.length > 0 && (
              <>
                {/* 진행률 */}
                <div className="rv-progress">
                  <div className="rv-progress__top">
                    <span className="rv-progress__label">평가 진행률</span>
                    <span className="rv-progress__count">
                      {ratedCount} / {approvedParticipants.length}명
                    </span>
                  </div>
                  <div className="rv-progress__bar">
                    <div
                      className="rv-progress__fill"
                      style={{ width: `${(ratedCount / approvedParticipants.length) * 100}%` }}
                    />
                  </div>
                  {selectedMatch.reviews?.createdAt && (
                    <span className="rv-progress__saved">
                      마지막 저장: {new Date(selectedMatch.reviews.createdAt).toLocaleString('ko-KR')}
                    </span>
                  )}
                </div>

                {/* 선수 카드 목록 */}
                <div className="rv-list">
                  {approvedParticipants.map((p) => (
                    <ReviewCard
                      key={p.id}
                      participant={p}
                      entry={entries[p.id] || { rating: 0, tags: [], touched: false }}
                      onRate={handleRate}
                      onToggleTag={handleToggleTag}
                      cardRef={(el) => { cardRefs.current[p.id] = el; }}
                    />
                  ))}
                </div>

                {/* 저장 */}
                <div className="rv-save-bar">
                  <span className="rv-save-bar__hint">
                    {ratedCount < approvedParticipants.length
                      ? `${approvedParticipants.length - ratedCount}명 평가 남음`
                      : '모든 선수 평가 완료 🎉'}
                  </span>
                  <Button variant="primary" onClick={handleSave}>
                    {ratedCount === approvedParticipants.length ? '평가 완료' : '임시 저장'}
                  </Button>
                </div>
              </>
            )}

            {selectedMatch && approvedParticipants.length === 0 && (
              <div className="rv-empty">
                <span>👥</span>
                <p>승인된 참여자가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default ReviewPage;
