import { useState, useEffect } from 'react';
import {
  Layout,
  Container,
  MatchForm,
  ParticipantForm,
  ParticipantList,
  MatchActions,
  TeamBuilder,
  Button,
} from '../components';
import { useAuthData, useMatchData } from '../hooks';
import { getMatchBadge, isJoinClosed } from '../utils/matchStatus';
import { REGION_OPTIONS } from '../utils/constants';

// 경기 일시를 목록 카드용 문자열로 변환 (예: 6월 4일 (목) 20:00)
const formatMatchDate = (datetime) => {
  if (!datetime) return '일정 미정';
  return new Date(datetime).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * MatchPage 컴포넌트
 * 경기 모집 및 참여 관리 페이지
 */
function MatchPage() {
  const {
    matches,
    createMatch,
    addParticipant,
    removeParticipant,
    updateMatch,
    deleteMatch,
    updateParticipant,
  } = useMatchData();
  const { currentUser } = useAuthData();
  const [currentMatch, setCurrentMatch] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [currentView, setCurrentView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [participantTab, setParticipantTab] = useState('pending');
  const [selectedRegions, setSelectedRegions] = useState([]); // 빈 배열 = 전체 지역
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState('');

  // 지역 체크박스 토글
  const toggleRegion = (region) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('matchId');
    const view = params.get('view');
    const resolvedView = view || (matchId ? 'manage' : 'list');

    setSelectedMatchId(matchId || null);
    setCurrentView(resolvedView);
  };

  const goToView = (view, matchId) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', 'match');

    if (view) {
      params.set('view', view);
    } else {
      params.delete('view');
    }

    if (matchId) {
      params.set('matchId', matchId);
    } else {
      params.delete('matchId');
    }

    const query = params.toString();
    window.history.pushState(null, '', `/?${query}`);
    setCurrentView(view || 'list');
    setSelectedMatchId(matchId || null);
  };

  // URL 파라미터를 읽어 현재 뷰와 선택 경기 ID를 동기화
  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);

    return () => {
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  // 선택된 경기 ID가 바뀌거나 matches가 갱신되면 currentMatch를 동기화
  useEffect(() => {
    if (!selectedMatchId) {
      setCurrentMatch(null);
      return;
    }

    const match = matches.find((m) => m.id === selectedMatchId);
    setCurrentMatch(match || null);
    setNoticeDraft(match?.notice || '');
  }, [matches, selectedMatchId]);

  // 경기 생성 처리
  const handleCreateMatch = async (formData) => {
    setLoading(true);
    try {
      createMatch({
        title: formData.title,
        location: formData.location,
        region: formData.region,
        datetime: formData.datetime,
        maxParticipants: parseInt(formData.maxParticipants, 10),
        description: formData.description,
        isPrivate: Boolean(formData.isPrivate),
      });

      goToView('list');

      alert('경기가 생성되었습니다!');
    } catch (error) {
      console.error('경기 생성 오류:', error);
      alert('경기 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 참여자 등록 처리
  const handleAddParticipant = async (formData) => {
    if (!currentMatch) {
      alert('먼저 경기를 생성해주세요.');
      return;
    }

    setLoading(true);
    try {
      const alreadyJoined = (currentMatch.participants || []).some(
        (participant) =>
          participant.userId === formData.userId &&
          getStatus(participant) !== 'rejected'
      );

      if (alreadyJoined) {
        alert('이미 참여 신청한 경기입니다.');
        return;
      }

      addParticipant(currentMatch.id, {
        userId: formData.userId,
        name: formData.name,
        age: parseInt(formData.age, 10),
        position: formData.position,
        skillTier: formData.skillTier,
        skillScore: parseInt(formData.skillScore, 10),
      });

      alert('참여 등록이 완료되었습니다!');
    } catch (error) {
      console.error('참여 등록 오류:', error);
      alert('참여 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (participant) => participant.status || 'approved';

  // 참여자 제거 처리
  const handleRemoveParticipant = (participantId) => {
    if (!currentMatch) return;
    removeParticipant(currentMatch.id, participantId);
  };

  const handleApproveParticipant = (participantId) => {
    if (!currentMatch) return;
    updateParticipant(currentMatch.id, participantId, { status: 'approved' });
  };

  const handleRejectParticipant = (participantId) => {
    if (!currentMatch) return;
    updateParticipant(currentMatch.id, participantId, { status: 'rejected' });
  };

  const handleApproveAllPending = () => {
    if (!currentMatch) return;

    const participants = currentMatch.participants || [];
    const pendingParticipants = participants.filter(
      (participant) => getStatus(participant) === 'pending'
    );

    if (pendingParticipants.length === 0) {
      alert('승인할 대기 참여자가 없습니다.');
      return;
    }

    if (!window.confirm(`대기 중인 ${pendingParticipants.length}명을 모두 승인할까요?`)) {
      return;
    }

    const nextParticipants = participants.map((participant) =>
      getStatus(participant) === 'pending'
        ? { ...participant, status: 'approved' }
        : participant
    );

    updateMatch(currentMatch.id, { participants: nextParticipants });

    alert('대기 참여자가 모두 승인되었습니다.');
  };

  // 경기 상태 변경
  const handleStatusChange = (newStatus) => {
    if (!currentMatch) return;
    updateMatch(currentMatch.id, { status: newStatus });
  };

  // 공지사항 저장
  const handleSaveNotice = () => {
    if (!currentMatch) return;
    updateMatch(currentMatch.id, { notice: noticeDraft.trim() });
    alert('공지사항이 저장되었습니다.');
  };

  // 팀 구성 확정 (자동 또는 수동 조정 결과 저장)
  const handleConfirmTeams = (teams) => {
    if (!currentMatch) return;
    updateMatch(currentMatch.id, { teams, status: 'ready' });
  };

  // 경기 삭제
  const handleDeleteMatch = () => {
    if (!currentMatch) return;

    deleteMatch(currentMatch.id);
    setSelectedMatchId(null);
    setCurrentMatch(null);
    alert('경기가 삭제되었습니다.');
    goToView('list');
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/', active: false },
      { label: '경기', href: '/?page=match', active: true },
      { label: '일정', href: '/?page=schedule' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
      { label: '마이페이지', href: '/?page=auth' },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container>
        {currentView === 'create' && (
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>새 경기 생성</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToView('list')}
              >
                목록으로
              </Button>
            </div>

            <MatchForm onSubmit={handleCreateMatch} loading={loading} />
          </div>
        )}

        {currentView === 'join' && (
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>참여 신청</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToView('list')}
              >
                목록으로
              </Button>
            </div>

            {currentMatch ? (
              <>
                <div
                  style={{
                    padding: 'var(--spacing-6)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    marginBottom: 'var(--spacing-6)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2)' }}>
                    {currentMatch.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-3)' }}>
                    장소 · {currentMatch.location}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-base)' }}>
                    일시 · {new Date(currentMatch.datetime).toLocaleString('ko-KR')}
                  </p>
                  {currentMatch.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-3)', fontStyle: 'italic' }}>
                      {currentMatch.description}
                    </p>
                  )}
                </div>

                {currentMatch.notice && (
                  <div
                    style={{
                      padding: 'var(--spacing-4)',
                      backgroundColor: 'rgba(243, 156, 18, 0.1)',
                      borderLeft: '4px solid var(--color-warning, #f39c12)',
                      borderRadius: 'var(--radius-base)',
                      marginBottom: 'var(--spacing-6)',
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: 'var(--spacing-2)' }}>
                      공지사항
                    </strong>
                    <p style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'pre-wrap' }}>
                      {currentMatch.notice}
                    </p>
                  </div>
                )}

                <ParticipantForm
                  onSubmit={handleAddParticipant}
                  currentUser={currentUser}
                  currentCount={(currentMatch.participants || []).filter((p) => getStatus(p) !== 'rejected').length}
                  maxCount={currentMatch.maxParticipants || 20}
                  isClosed={isJoinClosed(currentMatch)}
                  loading={loading}
                />
              </>
            ) : (
              <div style={{ padding: 'var(--spacing-6)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ marginBottom: 'var(--spacing-2)' }}>해당 경기를 찾을 수 없습니다.</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => goToView('list')}
                >
                  경기 목록 보기
                </Button>
              </div>
            )}
          </div>
        )}

        {currentView === 'manage' && currentMatch && (
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
              <h2 style={{ fontSize: 'var(--font-size-2xl)' }}>경기 관리</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => goToView('list')}
              >
                목록으로
              </Button>
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 'var(--spacing-4)',
                }}
              >
                <div
                  style={{
                    padding: 'var(--spacing-6)',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2)' }}>
                    {currentMatch.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-3)' }}>
                    장소 · {currentMatch.location}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-base)' }}>
                    일시 · {new Date(currentMatch.datetime).toLocaleString('ko-KR')}
                  </p>
                  {currentMatch.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-3)', fontStyle: 'italic' }}>
                      {currentMatch.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 공지사항 작성 */}
            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-gray-50)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-6)',
              }}
            >
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-2)' }}>
                📢 공지사항
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-3)' }}>
                참여 신청 화면에 표시됩니다. (예: 준비물, 회비, 우천 시 안내)
              </p>
              <textarea
                value={noticeDraft}
                onChange={(e) => setNoticeDraft(e.target.value)}
                placeholder="공지 내용을 입력하세요."
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-3)',
                  border: '1px solid var(--color-gray-300)',
                  borderRadius: 'var(--radius-base)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: 'var(--spacing-3)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" size="sm" onClick={handleSaveNotice}>
                  공지 저장
                </Button>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              {(() => {
                const participants = currentMatch.participants || [];
                const pendingParticipants = participants.filter((p) => getStatus(p) === 'pending');
                const approvedParticipants = participants.filter((p) => getStatus(p) === 'approved');
                const rejectedParticipants = participants.filter((p) => getStatus(p) === 'rejected');
                const activeParticipantsCount = pendingParticipants.length + approvedParticipants.length;

                const tabOptions = [
                  { id: 'pending', label: `대기 (${pendingParticipants.length})` },
                  { id: 'approved', label: `승인 (${approvedParticipants.length})` },
                  { id: 'rejected', label: `거절 (${rejectedParticipants.length})` },
                ];

                const tabTitle =
                  participantTab === 'approved'
                    ? '승인된 참여자'
                    : participantTab === 'rejected'
                      ? '거절된 참여자'
                      : '참여 대기자';

                const tabParticipants =
                  participantTab === 'approved'
                    ? approvedParticipants
                    : participantTab === 'rejected'
                      ? rejectedParticipants
                      : pendingParticipants;

                return (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-3)',
                        marginBottom: 'var(--spacing-3)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div className="participant-tabs" role="tablist" aria-label="참여 상태">
                        {tabOptions.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            className={[
                              'participant-tab-btn',
                              participantTab === tab.id && 'is-active',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => setParticipantTab(tab.id)}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                          신청자: {activeParticipantsCount} / {currentMatch.maxParticipants}
                        </span>
                        {participantTab === 'pending' && pendingParticipants.length > 0 && (
                          <Button variant="primary" size="sm" onClick={handleApproveAllPending}>
                            모두 승인
                          </Button>
                        )}
                      </div>
                    </div>

                    <ParticipantList
                      title={tabTitle}
                      participants={tabParticipants}
                      onApprove={participantTab === 'pending' ? handleApproveParticipant : undefined}
                      onReject={participantTab === 'pending' ? handleRejectParticipant : undefined}
                      onRemove={handleRemoveParticipant}
                      loading={loading}
                    />
                  </>
                );
              })()}
            </div>

            {(() => {
              const approvedParticipants = (currentMatch.participants || []).filter(
                (participant) => getStatus(participant) === 'approved'
              );

              const showTeamBuilder =
                (currentMatch.status === 'recruiting' || currentMatch.status === 'ready') &&
                approvedParticipants.length >= 2;

              if (!showTeamBuilder) return null;

              return (
              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <TeamBuilder
                  participants={approvedParticipants}
                  onConfirmTeams={handleConfirmTeams}
                  confirmedTeams={currentMatch.teams}
                  confirmedAt={currentMatch.updatedAt}
                />
              </div>
              );
            })()}

            <MatchActions
              match={currentMatch}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteMatch}
            />
          </div>
        )}

        {currentView === 'list' && (
          <div style={{ marginBottom: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--spacing-2)' }}>경기 목록</h2>
                <p style={{ color: 'var(--color-gray-600)' }}>새 경기를 만들거나 참여를 신청하세요.</p>
              </div>
              <button
                type="button"
                className="participant-tab-btn is-active"
                onClick={() => goToView('create')}
              >
                + 새 경기 생성
              </button>
            </div>

            {/* 지역 필터 */}
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <button
                type="button"
                className={['participant-tab-btn', selectedRegions.length > 0 && 'is-active']
                  .filter(Boolean)
                  .join(' ')}
                aria-expanded={isFilterOpen}
                onClick={() => setIsFilterOpen((prev) => !prev)}
              >
                지역 필터
                {selectedRegions.length > 0 ? ` (${selectedRegions.length})` : ''}
                {isFilterOpen ? ' ▲' : ' ▼'}
              </button>

              {isFilterOpen && (
                <div
                  style={{
                    marginTop: 'var(--spacing-2)',
                    padding: 'var(--spacing-4)',
                    backgroundColor: 'var(--color-gray-50)',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-base)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 'var(--spacing-2)',
                      marginBottom: 'var(--spacing-3)',
                    }}
                  >
                    {REGION_OPTIONS.map((region) => (
                      <label
                        key={region}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2)',
                          fontSize: 'var(--font-size-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(region)}
                          onChange={() => toggleRegion(region)}
                        />
                        {region}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>
                      {selectedRegions.length === 0
                        ? '선택한 지역이 없으면 전체 경기가 표시됩니다.'
                        : `${selectedRegions.join(', ')} 경기만 표시 중`}
                    </span>
                    {selectedRegions.length > 0 && (
                      <Button variant="secondary" size="sm" onClick={() => setSelectedRegions([])}>
                        초기화
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(() => {
              // 비공개 경기는 목록에서 숨기고(링크로만 접근), 선택된 지역 필터를 적용한다.
              const visibleMatches = matches.filter(
                (match) =>
                  !match.isPrivate &&
                  (selectedRegions.length === 0 || selectedRegions.includes(match.region))
              );

              if (visibleMatches.length === 0) {
                return (
                  <div style={{ padding: 'var(--spacing-6)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                    <p style={{ marginBottom: 'var(--spacing-2)' }}>
                      {matches.length === 0
                        ? '아직 생성된 경기가 없습니다.'
                        : '조건에 맞는 경기가 없습니다. 다른 지역을 선택해보세요.'}
                    </p>
                    <button
                      type="button"
                      className="participant-tab-btn is-active"
                      onClick={() => goToView('create')}
                    >
                      {matches.length === 0 ? '첫 경기 만들기' : '+ 새 경기 생성'}
                    </button>
                  </div>
                );
              }

              return (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 'var(--spacing-4)',
                }}
              >
                {visibleMatches.map((match) => {
                  const badge = getMatchBadge(match);
                  const isImminent = badge.type === 'imminent';
                  // 마감임박 경기는 빨간 테두리 + 옅은 빨간 배경으로 강조
                  const baseBorderColor = isImminent ? 'var(--color-error)' : 'var(--color-gray-400)';
                  const metaRows = [
                    ['일시', formatMatchDate(match.datetime)],
                    ['장소', `${match.region ? `[${match.region}] ` : ''}${match.location}`],
                    ['인원', `${match.participants.length} / ${match.maxParticipants}`],
                  ];

                  return (
                  <div
                    key={match.id}
                    onClick={() => goToView('join', match.id)}
                    style={{
                      padding: 'var(--spacing-4)',
                      backgroundColor: isImminent ? 'rgba(231, 76, 60, 0.04)' : 'var(--color-gray-50)',
                      border: `2px solid ${baseBorderColor}`,
                      borderRadius: 'var(--radius-base)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = isImminent
                        ? '0 8px 20px rgba(231, 76, 60, 0.25)'
                        : 'var(--shadow-lg)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = isImminent
                        ? 'var(--color-error)'
                        : 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = baseBorderColor;
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                      <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)' }}>
                        {match.title}
                      </h4>
                      <span
                        style={{
                          flexShrink: 0,
                          padding: 'var(--spacing-1) var(--spacing-2)',
                          backgroundColor: badge.color,
                          color: 'var(--color-white)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-bold)',
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ marginBottom: 'var(--spacing-3)' }}>
                      {metaRows.map(([label, value]) => (
                        <p
                          key={label}
                          style={{
                            display: 'flex',
                            gap: 'var(--spacing-2)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-gray-600)',
                            marginBottom: 'var(--spacing-1)',
                          }}
                        >
                          <span
                            style={{
                              flexShrink: 0,
                              width: '28px',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-bold)',
                              color: 'var(--color-gray-400)',
                            }}
                          >
                            {label}
                          </span>
                          {value}
                        </p>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isJoinClosed(match)}
                        onClick={(event) => {
                          event.stopPropagation();
                          goToView('join', match.id);
                        }}
                      >
                        {isJoinClosed(match) ? '마감' : '참여'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToView('manage', match.id);
                        }}
                      >
                        관리
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
              );
            })()}
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default MatchPage;
