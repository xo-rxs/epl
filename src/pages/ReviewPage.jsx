import { useEffect, useMemo, useState } from 'react';
import { Layout, Container, Card, Button } from '../components';
import { useMatchData } from '../hooks';

const getStatus = (participant) => participant.status || 'approved';
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
  existingEntries.forEach((entry) => {
    map[entry.participantId] = {
      rating: entry.rating,
      tags: entry.tags || [],
    };
  });

  participants.forEach((participant) => {
    if (!map[participant.id]) {
      map[participant.id] = {
        rating: 3,
        tags: [],
      };
    }
  });

  return map;
};

function ReviewPage() {
  const { matches, updateMatch } = useMatchData();
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id || '');
  const [entries, setEntries] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectedMatch = useMemo(() => {
    return matches.find((match) => match.id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  const approvedParticipants = useMemo(() => {
    if (!selectedMatch) return [];
    return (selectedMatch.participants || []).filter(
      (participant) => getStatus(participant) === 'approved'
    );
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) {
      setEntries({});
      setCurrentIndex(0);
      return;
    }

    setEntries(
      buildInitialEntries(approvedParticipants, selectedMatch.reviews?.entries || [])
    );
    setCurrentIndex(0);
  }, [approvedParticipants, selectedMatch]);

  const handleEntryChange = (participantId, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: value,
      },
    }));
  };

  const handleToggleTag = (participantId, tag) => {
    setEntries((prev) => {
      const currentTags = prev[participantId]?.tags || [];
      const nextTags = currentTags.includes(tag)
        ? currentTags.filter((item) => item !== tag)
        : [...currentTags, tag];

      return {
        ...prev,
        [participantId]: {
          ...prev[participantId],
          tags: nextTags,
        },
      };
    });
  };

  const handleSaveReviews = () => {
    if (!selectedMatch) return;

    const reviewEntries = approvedParticipants.map((participant) => {
      const entry = entries[participant.id] || { rating: 3, tags: [] };
      return {
        participantId: participant.id,
        nickname: participant.name || participant.nickname,
        age: participant.age,
        position: participant.position,
        rating: Number(entry.rating) || 3,
        tags: entry.tags || [],
      };
    });

    updateMatch(selectedMatch.id, {
      reviews: {
        createdBy: 'host',
        createdAt: new Date().toISOString(),
        entries: reviewEntries,
      },
    });

    alert('평가가 저장되었습니다.');
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/', active: false },
      { label: '경기', href: '/?page=match' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews', active: true },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-4)' }}>
          경기 평가
        </h2>

        {matches.length === 0 ? (
          <Card header={<h3 className="card-header-title">안내</h3>}>
            <p>먼저 경기를 생성하고 참여자를 승인해주세요.</p>
          </Card>
        ) : (
          <>
            <Card header={<h3 className="card-header-title">경기 선택</h3>}>
              <select
                value={selectedMatchId}
                onChange={(event) => setSelectedMatchId(event.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-base)',
                }}
              >
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.title} ({match.participants.length}/{match.maxParticipants})
                  </option>
                ))}
              </select>
            </Card>

            {selectedMatch && (
              <div style={{ marginTop: 'var(--spacing-6)' }}>
                <Card header={<h3 className="card-header-title">평가 대상</h3>}>
                  {selectedMatch.reviews?.createdAt && (
                    <p style={{ marginBottom: 'var(--spacing-4)', color: 'var(--color-gray-600)' }}>
                      마지막 저장: {new Date(selectedMatch.reviews.createdAt).toLocaleString('ko-KR')}
                    </p>
                  )}

                  {approvedParticipants.length === 0 ? (
                    <p>승인된 참여자가 없습니다.</p>
                  ) : (
                    (() => {
                      const participant = approvedParticipants[currentIndex];
                      const entry = participant
                        ? entries[participant.id] || { rating: 3, tags: [] }
                        : null;

                      return (
                        <div style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                          <div
                            style={{
                              padding: 'var(--spacing-4)',
                              border: '1px solid var(--color-gray-200)',
                              borderRadius: 'var(--radius-base)',
                              backgroundColor: 'var(--color-gray-50)',
                            }}
                          >
                            <div style={{ marginBottom: 'var(--spacing-3)' }}>
                              <strong>{participant.name || participant.nickname}</strong>
                              <span style={{ marginLeft: 'var(--spacing-2)', color: 'var(--color-gray-600)' }}>
                                {participant.age ? `${participant.age}세` : `${participant.year}학년`} · {participant.position}
                              </span>
                              <div style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-gray-600)' }}>
                                {currentIndex + 1} / {approvedParticipants.length}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                              <div>
                                <label>평점 (1~5)</label>
                                <div className="review-star-group" role="radiogroup" aria-label="평점">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      className={`review-star-btn ${entry.rating >= score ? 'is-active' : ''}`}
                                      aria-pressed={entry.rating >= score}
                                      onClick={() => handleEntryChange(participant.id, 'rating', score)}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="review-star-value">{entry.rating}점</span>
                                </div>
                              </div>

                              <div>
                                <label>평가 태그</label>
                                <div style={{ display: 'grid', gap: 'var(--spacing-3)' }}>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                                    {REVIEW_TAGS.positive.map((tag) => {
                                      const tagLabel = `${tag.emoji} ${tag.label}`;
                                      const isActive = entry.tags.includes(tagLabel);
                                      return (
                                        <Button
                                          key={tagLabel}
                                          variant={isActive ? 'primary' : 'secondary'}
                                          size="sm"
                                          className="review-tag-btn"
                                          onClick={() => handleToggleTag(participant.id, tagLabel)}
                                        >
                                          {tagLabel}
                                        </Button>
                                      );
                                    })}
                                  </div>

                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                                    {REVIEW_TAGS.negative.map((tag) => {
                                      const tagLabel = `${tag.emoji} ${tag.label}`;
                                      const isActive = entry.tags.includes(tagLabel);
                                      return (
                                        <Button
                                          key={tagLabel}
                                          variant={isActive ? 'primary' : 'secondary'}
                                          size="sm"
                                          className="review-tag-btn"
                                          onClick={() => handleToggleTag(participant.id, tagLabel)}
                                        >
                                          {tagLabel}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
                                선택됨: {entry.tags.length > 0 ? entry.tags.join(', ') : '없음'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                              variant="secondary"
                              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                              disabled={currentIndex === 0}
                            >
                              이전
                            </Button>
                            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                              <Button variant="secondary" onClick={handleSaveReviews}>
                                임시 저장
                              </Button>
                              {currentIndex === approvedParticipants.length - 1 ? (
                                <Button variant="primary" onClick={handleSaveReviews}>
                                  평가 완료
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  onClick={() =>
                                    setCurrentIndex((prev) =>
                                      Math.min(prev + 1, approvedParticipants.length - 1)
                                    )
                                  }
                                >
                                  다음
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </Card>
              </div>
            )}
          </>
        )}
      </Container>
    </Layout>
  );
}

export default ReviewPage;
