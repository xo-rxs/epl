import { useMemo, useRef, useState } from 'react';
import { Layout, Container, Input, Button } from '../components';
import { useAuthData, useMatchData } from '../hooks';
import { getReviewPoints } from '../utils/reviewPoints';
import '../styles/AuthPage.css';

const INITIAL_FORM = {
  email: '',
  name: '',
  age: '',
  preferredPosition: 'MF',
  skillTier: 'HIKER',
  password: '',
  passwordConfirm: '',
};

const POSITION_OPTIONS = [
  { value: 'GK', label: 'GK', desc: '골키퍼' },
  { value: 'DF', label: 'DF', desc: '수비수' },
  { value: 'MF', label: 'MF', desc: '미드필더' },
  { value: 'FW', label: 'FW', desc: '공격수' },
];

const SKILL_TIERS = [
  {
    value: 'THE_GOAT',
    label: 'THE GOAT',
    range: '8000m+',
    marker: '8000m+',
    description: '에베레스트급, 경기 지배형 에이스 / 선수 출신 수준',
    color: '#f39c12',
  },
  {
    value: 'ALPINE',
    label: 'ALPINE',
    range: '4000m-7999m',
    marker: '4000m',
    description: '몽블랑 / 마터호른급, 동호회 최상위권 선수',
    color: '#e74c3c',
  },
  {
    value: 'PEAK',
    label: 'PEAK',
    range: '1500m-3999m',
    marker: '1500m',
    description: '백두산 / 한라산급, 믿고 맡길 수 있는 숙련자',
    color: '#9b59b6',
  },
  {
    value: 'HIKER',
    label: 'HIKER',
    range: '500m-1499m',
    marker: '500m',
    description: '북한산 / 지리산급, 컨디션 편차가 있는 일반 동호인',
    color: '#2ecc71',
  },
  {
    value: 'VALLEY',
    label: 'VALLEY',
    range: '0m-499m',
    marker: '0m',
    description: '입문자 수준',
    color: '#3498db',
  },
];

const getTierIndexFromY = (clientY, element) => {
  const rect = element.getBoundingClientRect();
  const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 0.999);
  return Math.floor(ratio * SKILL_TIERS.length);
};

const SkillMountain = ({ selectedValue, interactive = false, onSelect }) => {
  const selectedIndex = Math.max(
    SKILL_TIERS.findIndex((t) => t.value === selectedValue),
    0
  );
  const goatTop = `${((selectedIndex + 0.5) / SKILL_TIERS.length) * 100}%`;

  return (
    <div
      className={['auth-mountain', !interactive && 'auth-mountain-readonly'].filter(Boolean).join(' ')}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? '스킬 티어' : '내 스킬 티어 산'}
    >
      <div className="auth-mountain-shape" aria-hidden="true" />
      {SKILL_TIERS.map((tier) => {
        const isSelected = tier.value === selectedValue;
        return (
          <button
            key={tier.value}
            type="button"
            className={`auth-altitude-line ${isSelected ? 'is-selected' : ''}`}
            aria-pressed={interactive ? isSelected : undefined}
            disabled={!interactive}
            onClick={() => onSelect?.(tier.value)}
          >
            <span className="auth-altitude-marker">{tier.marker}</span>
            <span className="auth-altitude-tier">{tier.label}</span>
          </button>
        );
      })}
      <div className="auth-goat" style={{ top: goatTop }} aria-hidden="true">
        🐐
      </div>
    </div>
  );
};

/* 단계 표시 컴포넌트 */
const StepIndicator = ({ current, total }) => (
  <div className="auth-steps">
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className={`auth-step ${i < current ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`}>
        <div className="auth-step__dot">
          {i < current ? '✓' : i + 1}
        </div>
        <span className="auth-step__label">
          {i === 0 ? '기본 정보' : '스킬 티어'}
        </span>
      </div>
    ))}
    <div className="auth-step__line" style={{ width: `${((current) / (total - 1)) * 100}%` }} />
  </div>
);

/**
 * AuthPage 컴포넌트
 * 2단계 회원가입 + 로그인 화면
 */
function AuthPage() {
  const { currentUser, login, signUp, logout, updateProfile } = useAuthData();
  const { matches } = useMatchData();
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState(0); // 회원가입 단계 (0: 기본정보, 1: 스킬티어)
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({ preferredPosition: 'MF', skillTier: 'HIKER' });
  const mountainRef = useRef(null);

  const isLogin = mode === 'login';
  const selectedTier = SKILL_TIERS.find((t) => t.value === formData.skillTier);
  const currentUserTier = SKILL_TIERS.find((t) => t.value === currentUser?.skillTier);

  // 내가 받은 익명 평가 요약 (평균 별점, 받은 평가 수, 자주 받은 태그)
  const reviewSummary = useMemo(() => {
    if (!currentUser) return null;

    const ratings = [];
    const tagCounts = {};

    matches.forEach((match) => {
      const myParticipantIds = new Set(
        (match.participants || [])
          .filter((p) => p.userId === currentUser.id)
          .map((p) => p.id)
      );
      if (myParticipantIds.size === 0) return;

      Object.values(match.reviewsByUser || {}).forEach((review) => {
        (review.entries || []).forEach((entry) => {
          if (!myParticipantIds.has(entry.participantId) || !(entry.rating > 0)) return;
          ratings.push(entry.rating);
          (entry.tags || []).forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
      });
    });

    return {
      count: ratings.length,
      avgRating: ratings.length
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0,
      topTags: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    };
  }, [matches, currentUser]);

  const reviewPoints = currentUser ? getReviewPoints(currentUser.id) : 0;

  const handleStartEditProfile = () => {
    setEditProfile({
      preferredPosition: currentUser?.preferredPosition || 'MF',
      skillTier: currentUser?.skillTier || 'HIKER',
    });
    setIsEditingProfile(true);
    setMessage({ text: '', isError: false });
  };

  const handleSaveProfile = () => {
    const result = updateProfile(editProfile);

    if (!result.ok) {
      setMessage({ text: result.message, isError: true });
      return;
    }

    setIsEditingProfile(false);
    setMessage({ text: '프로필이 수정되었습니다! ✅', isError: false });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage({ text: '', isError: false });
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setStep(0);
    setFormData(INITIAL_FORM);
    setMessage({ text: '', isError: false });
  };

  /* Step 1 → Step 2 전환 시 유효성 검사 */
  const handleNextStep = (event) => {
    event.preventDefault();

    if (!formData.email || !formData.name || !formData.age || !formData.password) {
      setMessage({ text: '모든 필드를 입력해주세요.', isError: true });
      return;
    }
    if (formData.password.length < 6) {
      setMessage({ text: '비밀번호는 6자 이상이어야 합니다.', isError: true });
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setMessage({ text: '비밀번호가 일치하지 않습니다.', isError: true });
      return;
    }

    setMessage({ text: '', isError: false });
    setStep(1);
  };

  const selectTierByPointer = (clientY) => {
    if (!mountainRef.current) return;
    const tierIndex = getTierIndexFromY(clientY, mountainRef.current);
    setFormData((prev) => ({ ...prev, skillTier: SKILL_TIERS[tierIndex].value }));
  };

  const handleMountainPointerDown = (event) => {
    selectTierByPointer(event.clientY);
    const onMove = (e) => selectTierByPointer(e.clientY);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = isLogin ? login(formData) : signUp(formData);

    if (!result.ok) {
      setMessage({ text: result.message, isError: true });
      return;
    }

    setMessage({
      text: isLogin ? '로그인되었습니다.' : '회원가입이 완료되었습니다! 🎉',
      isError: false,
    });
  };

  /* 비밀번호 강도 */
  const pwStrength = (() => {
    const pw = formData.password;
    if (!pw) return null;
    if (pw.length < 6) return { label: '너무 짧음', level: 1 };
    if (pw.length < 8) return { label: '보통', level: 2 };
    return { label: '강함', level: 3 };
  })();

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/' },
      { label: '경기', href: '/?page=match' },
      { label: '일정', href: '/?page=schedule' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
      { label: '마이페이지', href: '/?page=auth', active: true },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container size="sm">
        <div className="auth-page">

          {/* ─── 로그인 상태 ─── */}
          {currentUser ? (
            <div className="auth-card">
              <div className="auth-card__header">
                <h2 className="auth-title">마이페이지</h2>
                <p className="auth-description">내 프로필과 플레이 티어를 확인합니다.</p>
              </div>
              <div className="auth-current-user">
                <dl className="auth-user-info">
                  {[
                    ['이름', currentUser.name || currentUser.nickname],
                    ['이메일', currentUser.email],
                    ['나이', currentUser.age ? `${currentUser.age}세` : '미입력'],
                    ['선호 포지션', currentUser.preferredPosition || '미입력'],
                    ['스킬 티어', currentUserTier ? `${currentUserTier.label} · ${currentUserTier.range}` : '미입력'],
                  ].map(([dt, dd]) => (
                    <div key={dt}>
                      <dt>{dt}</dt>
                      <dd>{dd}</dd>
                    </div>
                  ))}
                </dl>

                {/* 받은 평가 요약 + 평가 포인트 */}
                <div className="auth-review-summary">
                  <div className="auth-review-stat">
                    <span className="auth-review-stat__value">{reviewPoints}P</span>
                    <span className="auth-review-stat__label">평가 포인트</span>
                  </div>
                  <div className="auth-review-stat">
                    <span className="auth-review-stat__value">
                      {reviewSummary?.count > 0 ? `★ ${reviewSummary.avgRating.toFixed(1)}` : '-'}
                    </span>
                    <span className="auth-review-stat__label">평균 별점</span>
                  </div>
                  <div className="auth-review-stat">
                    <span className="auth-review-stat__value">{reviewSummary?.count || 0}</span>
                    <span className="auth-review-stat__label">받은 평가</span>
                  </div>
                </div>
                {reviewSummary?.topTags.length > 0 && (
                  <div className="auth-review-tags">
                    {reviewSummary.topTags.map(([tag, count]) => (
                      <span key={tag} className="auth-review-tag">
                        {tag} ×{count}
                      </span>
                    ))}
                  </div>
                )}

                {/* 프로필 수정 (선호 포지션 / 스킬 티어) */}
                {isEditingProfile ? (
                  <div className="auth-profile-edit">
                    <div className="auth-field">
                      <label>선호 포지션</label>
                      <div className="auth-position-grid">
                        {POSITION_OPTIONS.map((pos) => (
                          <button
                            key={pos.value}
                            type="button"
                            className={`auth-position-btn ${editProfile.preferredPosition === pos.value ? 'is-active' : ''}`}
                            onClick={() =>
                              setEditProfile((prev) => ({ ...prev, preferredPosition: pos.value }))
                            }
                          >
                            <span className="auth-position-btn__label">{pos.label}</span>
                            <span className="auth-position-btn__desc">{pos.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="auth-field">
                      <label>스킬 티어</label>
                      <SkillMountain
                        selectedValue={editProfile.skillTier}
                        interactive
                        onSelect={(value) =>
                          setEditProfile((prev) => ({ ...prev, skillTier: value }))
                        }
                      />
                    </div>
                    <div className="auth-step-nav">
                      <Button variant="secondary" onClick={() => setIsEditingProfile(false)}>
                        취소
                      </Button>
                      <Button onClick={handleSaveProfile}>저장</Button>
                    </div>
                  </div>
                ) : (
                  currentUserTier && (
                    <>
                      <SkillMountain selectedValue={currentUser.skillTier} />
                      <div className="auth-tier-card" style={{ borderColor: currentUserTier.color + '60', background: currentUserTier.color + '0e' }}>
                        <strong style={{ color: currentUserTier.color }}>{currentUserTier.label}</strong>
                        <span>{currentUserTier.description}</span>
                      </div>
                    </>
                  )
                )}

                {message.text && (
                  <p className={`auth-message ${message.isError ? 'is-error' : 'is-success'}`}>
                    {message.text}
                  </p>
                )}

                <div className="auth-actions">
                  {!isEditingProfile && (
                    <Button variant="primary" onClick={handleStartEditProfile}>
                      ✏️ 프로필 수정
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      window.history.pushState(null, '', '/?page=match');
                      window.dispatchEvent(new Event('popstate'));
                    }}
                  >
                    경기 목록으로
                  </Button>
                  <Button variant="danger" onClick={logout}>
                    로그아웃
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="auth-card">
              {/* 탭 */}
              <div className="auth-tabs" role="tablist" aria-label="인증 방식">
                <button type="button" className={isLogin ? 'is-active' : ''} onClick={() => handleModeChange('login')}>
                  로그인
                </button>
                <button type="button" className={!isLogin ? 'is-active' : ''} onClick={() => handleModeChange('signup')}>
                  회원가입
                </button>
              </div>

              {/* ─── 로그인 폼 ─── */}
              {isLogin ? (
                <form className="auth-form" onSubmit={handleSubmit}>
                  <Input label="이메일" type="email" name="email" placeholder="epl@example.com" value={formData.email} onChange={handleChange} required />
                  <Input label="비밀번호" type="password" name="password" placeholder="비밀번호 입력" value={formData.password} onChange={handleChange} required />
                  {message.text && (
                    <p className={`auth-message ${message.isError ? 'is-error' : 'is-success'}`}>{message.text}</p>
                  )}
                  <Button type="submit" fullWidth>로그인</Button>
                  <p className="auth-switch">
                    계정이 없으신가요?{' '}
                    <button type="button" onClick={() => handleModeChange('signup')}>회원가입</button>
                  </p>
                </form>
              ) : (
                <>
                  {/* 회원가입 진행 표시 */}
                  <StepIndicator current={step} total={2} />

                  {/* Step 1: 기본 정보 */}
                  {step === 0 && (
                    <form className="auth-form" onSubmit={handleNextStep}>
                      <div className="auth-form-section">
                        <p className="auth-form-section__label">계정 정보</p>
                        <Input label="이메일" type="email" name="email" placeholder="epl@example.com" value={formData.email} onChange={handleChange} required />
                        <div className="auth-pw-wrap">
                          <Input label="비밀번호" type="password" name="password" placeholder="6자 이상" value={formData.password} onChange={handleChange} required />
                          {pwStrength && (
                            <div className="auth-pw-strength">
                              {[1, 2, 3].map((n) => (
                                <div
                                  key={n}
                                  className="auth-pw-strength__bar"
                                  style={{
                                    background: n <= pwStrength.level
                                      ? pwStrength.level === 1 ? '#e74c3c' : pwStrength.level === 2 ? '#f39c12' : '#2ecc71'
                                      : '#e9ecef',
                                  }}
                                />
                              ))}
                              <span className="auth-pw-strength__label">{pwStrength.label}</span>
                            </div>
                          )}
                        </div>
                        <Input label="비밀번호 확인" type="password" name="passwordConfirm" placeholder="비밀번호 재입력" value={formData.passwordConfirm} onChange={handleChange} required />
                      </div>

                      <div className="auth-form-section">
                        <p className="auth-form-section__label">프로필</p>
                        <div className="auth-row">
                          <Input label="이름" name="name" placeholder="홍길동" value={formData.name} onChange={handleChange} required />
                          <Input label="나이" type="number" name="age" placeholder="24" value={formData.age} onChange={handleChange} min="8" max="80" required />
                        </div>

                        <div className="auth-field">
                          <label>선호 포지션 <span className="auth-required">*</span></label>
                          <div className="auth-position-grid">
                            {POSITION_OPTIONS.map((pos) => (
                              <button
                                key={pos.value}
                                type="button"
                                className={`auth-position-btn ${formData.preferredPosition === pos.value ? 'is-active' : ''}`}
                                onClick={() => setFormData((prev) => ({ ...prev, preferredPosition: pos.value }))}
                              >
                                <span className="auth-position-btn__label">{pos.label}</span>
                                <span className="auth-position-btn__desc">{pos.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {message.text && (
                        <p className={`auth-message ${message.isError ? 'is-error' : 'is-success'}`}>{message.text}</p>
                      )}
                      <Button type="submit" fullWidth>다음 단계 →</Button>
                    </form>
                  )}

                  {/* Step 2: 스킬 티어 */}
                  {step === 1 && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                      <div className="auth-tier-step">
                        <p className="auth-tier-step__guide">
                          클릭하거나 드래그해서 내 실력에 맞는 티어를 선택하세요.
                        </p>
                        <div ref={mountainRef} onPointerDown={handleMountainPointerDown}>
                          <SkillMountain
                            selectedValue={formData.skillTier}
                            interactive
                            onSelect={(value) => setFormData((prev) => ({ ...prev, skillTier: value }))}
                          />
                        </div>
                        {selectedTier && (
                          <div className="auth-tier-selected" style={{ borderColor: selectedTier.color, background: selectedTier.color + '12' }}>
                            <div className="auth-tier-selected__top">
                              <strong style={{ color: selectedTier.color }}>{selectedTier.label}</strong>
                              <span className="auth-tier-selected__range">{selectedTier.range}</span>
                            </div>
                            <p className="auth-tier-selected__desc">{selectedTier.description}</p>
                          </div>
                        )}
                      </div>

                      {message.text && (
                        <p className={`auth-message ${message.isError ? 'is-error' : 'is-success'}`}>{message.text}</p>
                      )}

                      <div className="auth-step-nav">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => { setStep(0); setMessage({ text: '', isError: false }); }}
                        >
                          ← 이전
                        </Button>
                        <Button type="submit">가입 완료</Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Container>
    </Layout>
  );
}

export default AuthPage;
