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
  }, [matches, selectedMatchId]);

  // 경기 생성 처리
  const handleCreateMatch = async (formData) => {
    setLoading(true);
    try {
      const newMatch = createMatch({
        title: formData.title,
        location: formData.location,
        datetime: formData.datetime,
        maxParticipants: parseInt(formData.maxParticipants, 10),
        description: formData.description,
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
        nickname: formData.name,
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
    alert('경기 상태가 변경되었습니다.');
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
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
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
                    📍 {currentMatch.location}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-base)' }}>
                    🕐 {new Date(currentMatch.datetime).toLocaleString('ko-KR')}
                  </p>
                  {currentMatch.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-3)', fontStyle: 'italic' }}>
                      {currentMatch.description}
                    </p>
                  )}
                </div>

                <ParticipantForm
                  onSubmit={handleAddParticipant}
                  currentUser={currentUser}
                  currentCount={(currentMatch.participants || []).filter((p) => getStatus(p) !== 'rejected').length}
                  maxCount={currentMatch.maxParticipants || 20}
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
                    📍 {currentMatch.location}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-base)' }}>
                    🕐 {new Date(currentMatch.datetime).toLocaleString('ko-KR')}
                  </p>
                  {currentMatch.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-3)', fontStyle: 'italic' }}>
                      {currentMatch.description}
                    </p>
                  )}
                </div>
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
                    ? '✅ 승인된 참여자'
                    : participantTab === 'rejected'
                      ? '⛔ 거절된 참여자'
                      : '⏳ 참여 대기자';

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

              if (currentMatch.status !== 'recruiting' || approvedParticipants.length < 2) {
                return null;
              }

              return (
              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <TeamBuilder participants={approvedParticipants} />
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

            {matches.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 'var(--spacing-4)',
                }}
              >
                {matches.map((match) => (
                  <div
                    key={match.id}
                    onClick={() => goToView('join', match.id)}
                    style={{
                      padding: 'var(--spacing-4)',
                      backgroundColor: 'var(--color-gray-50)',
                      border: '2px solid var(--color-gray-400)',
                      borderRadius: 'var(--radius-base)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--color-gray-400)';
                    }}
                  >
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-2)' }}>
                      {match.title}
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-2)' }}>
                      📍 {match.location}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-2)' }}>
                      👥 {match.participants.length} / {match.maxParticipants}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: 'var(--spacing-1) var(--spacing-2)',
                        backgroundColor: match.status === 'recruiting' ? 'var(--color-info)' : 'var(--color-success)',
                        color: 'var(--color-white)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: 'var(--spacing-3)',
                      }}
                    >
                      {match.status === 'recruiting' ? '모집 중' : '준비 완료'}
                    </span>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          goToView('join', match.id);
                        }}
                      >
                        참여
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
                ))}
              </div>
            ) : (
              <div style={{ padding: 'var(--spacing-6)', backgroundColor: 'var(--color-gray-50)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ marginBottom: 'var(--spacing-2)' }}>아직 생성된 경기가 없습니다.</p>
                <button
                  type="button"
                  className="participant-tab-btn is-active"
                  onClick={() => goToView('create')}
                >
                  첫 경기 만들기
                </button>
              </div>
            )}
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default MatchPage;
