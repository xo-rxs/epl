import { useRef, useState } from 'react';
import { Layout, Container, Card, Input, Button } from '../components';
import { useAuthData } from '../hooks';
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

const POSITION_OPTIONS = ['GK', 'DF', 'MF', 'FW'];
const SKILL_TIERS = [
  {
    value: 'THE_GOAT',
    label: 'THE GOAT',
    range: '8000m+',
    marker: '8000m+',
    description: '에베레스트급, 경기 지배형 에이스 / 선수 출신 수준',
  },
  {
    value: 'ALPINE',
    label: 'ALPINE',
    range: '4000m-7999m',
    marker: '4000m',
    description: '몽블랑 / 마터호른급, 동호회 최상위권 선수',
  },
  {
    value: 'PEAK',
    label: 'PEAK',
    range: '1500m-3999m',
    marker: '1500m',
    description: '백두산 / 한라산급, 믿고 맡길 수 있는 숙련자',
  },
  {
    value: 'HIKER',
    label: 'HIKER',
    range: '500m-1499m',
    marker: '500m',
    description: '북한산 / 지리산급, 컨디션 편차가 있는 일반 동호인',
  },
  {
    value: 'VALLEY',
    label: 'VALLEY',
    range: '0m-499m',
    marker: '0m',
    description: '입문자 수준',
  },
];

const getTierIndexFromY = (clientY, element) => {
  const rect = element.getBoundingClientRect();
  const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 0.999);
  return Math.floor(ratio * SKILL_TIERS.length);
};

const SkillMountain = ({
  selectedValue,
  interactive = false,
  onSelect,
}) => {
  const selectedIndex = Math.max(
    SKILL_TIERS.findIndex((tier) => tier.value === selectedValue),
    0
  );
  const goatTop = `${((selectedIndex + 0.5) / SKILL_TIERS.length) * 100}%`;

  return (
    <div
      className={[
        'auth-mountain',
        !interactive && 'auth-mountain-readonly',
      ]
        .filter(Boolean)
        .join(' ')}
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
      <div
        className="auth-goat"
        style={{ top: goatTop }}
        aria-hidden="true"
      >
        🐐
      </div>
    </div>
  );
};

/**
 * AuthPage 컴포넌트
 * LocalStorage 기반 로그인 및 회원가입 화면
 */
function AuthPage() {
  const { currentUser, login, signUp, logout } = useAuthData();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [message, setMessage] = useState('');
  const mountainRef = useRef(null);

  const isLogin = mode === 'login';
  const selectedTier = SKILL_TIERS.find((tier) => tier.value === formData.skillTier);
  const currentUserTier = SKILL_TIERS.find(
    (tier) => tier.value === currentUser?.skillTier
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage('');
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setFormData(INITIAL_FORM);
    setMessage('');
  };

  const selectTierByPointer = (clientY) => {
    if (!mountainRef.current) return;

    const tierIndex = getTierIndexFromY(clientY, mountainRef.current);
    const nextTier = SKILL_TIERS[tierIndex];

    setFormData((prev) => ({
      ...prev,
      skillTier: nextTier.value,
    }));
    setMessage('');
  };

  const handleMountainPointerDown = (event) => {
    selectTierByPointer(event.clientY);

    const handlePointerMove = (moveEvent) => {
      selectTierByPointer(moveEvent.clientY);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = isLogin ? login(formData) : signUp(formData);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage(isLogin ? '로그인되었습니다.' : '회원가입이 완료되었습니다.');
  };

  const headerProps = {
    title: 'EPL',
    subtitle: 'Easy Pick League',
    logo: '⚽',
    navItems: [
      { label: '홈', href: '/' },
      { label: '경기', href: '/?page=match' },
      { label: '팀 구성', href: '/?page=teams' },
      { label: '평가', href: '/?page=reviews' },
    ],
  };

  return (
    <Layout headerProps={headerProps}>
      <Container size="sm">
        <div className="auth-page">
          <Card
            header={
              <div>
                <h2 className="auth-title">
                  {currentUser ? '마이페이지' : isLogin ? '로그인' : '회원가입'}
                </h2>
                <p className="auth-description">
                  {currentUser
                    ? '내 프로필과 플레이 티어를 확인합니다.'
                    : 'EPL 경기 생성과 관리를 위해 계정을 사용합니다.'}
                </p>
              </div>
            }
          >
            {currentUser ? (
              <div className="auth-current-user">
                <dl className="auth-user-info">
                  <div>
                    <dt>이름</dt>
                    <dd>{currentUser.name || currentUser.nickname}</dd>
                  </div>
                  <div>
                    <dt>이메일</dt>
                    <dd>{currentUser.email}</dd>
                  </div>
                  <div>
                    <dt>나이</dt>
                    <dd>{currentUser.age ? `${currentUser.age}세` : '미입력'}</dd>
                  </div>
                  <div>
                    <dt>선호 포지션</dt>
                    <dd>{currentUser.preferredPosition || '미입력'}</dd>
                  </div>
                  <div>
                    <dt>스킬 티어</dt>
                    <dd>
                      {currentUserTier
                        ? `${currentUserTier.label} · ${currentUserTier.range}`
                        : '미입력'}
                    </dd>
                  </div>
                </dl>
                {currentUserTier && (
                  <>
                    <SkillMountain selectedValue={currentUser.skillTier} />
                    <div className="auth-tier-card">
                      <strong>{currentUserTier.label}</strong>
                      <span>{currentUserTier.description}</span>
                    </div>
                  </>
                )}
                <div className="auth-actions">
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
            ) : (
              <>
                <div className="auth-tabs" role="tablist" aria-label="인증 방식">
                  <button
                    type="button"
                    className={isLogin ? 'is-active' : ''}
                    onClick={() => handleModeChange('login')}
                  >
                    로그인
                  </button>
                  <button
                    type="button"
                    className={!isLogin ? 'is-active' : ''}
                    onClick={() => handleModeChange('signup')}
                  >
                    회원가입
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <Input
                    label="이메일"
                    type="email"
                    name="email"
                    placeholder="epl@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                  {!isLogin && (
                    <Input
                      label="이름"
                      name="name"
                      placeholder="홍길동"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  )}

                  {!isLogin && (
                    <Input
                      label="나이"
                      type="number"
                      name="age"
                      placeholder="24"
                      value={formData.age}
                      onChange={handleChange}
                      min="8"
                      max="80"
                      required
                    />
                  )}

                  {!isLogin && (
                    <div className="auth-field">
                      <label htmlFor="preferredPosition">
                        선호 포지션 <span className="auth-required">*</span>
                      </label>
                      <select
                        id="preferredPosition"
                        name="preferredPosition"
                        value={formData.preferredPosition}
                        onChange={handleChange}
                        required
                      >
                        {POSITION_OPTIONS.map((position) => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="auth-field">
                      <label>
                        스킬 티어 <span className="auth-required">*</span>
                      </label>
                      <div
                        ref={mountainRef}
                        onPointerDown={handleMountainPointerDown}
                      >
                        <SkillMountain
                          selectedValue={formData.skillTier}
                          interactive
                          onSelect={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              skillTier: value,
                            }));
                          }}
                        />
                      </div>
                      {selectedTier && (
                        <p className="auth-tier-hint">
                          {selectedTier.label} · {selectedTier.range} · {selectedTier.description}
                        </p>
                      )}
                    </div>
                  )}

                  <Input
                    label="비밀번호"
                    type="password"
                    name="password"
                    placeholder="6자 이상"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />

                  {!isLogin && (
                    <Input
                      label="비밀번호 확인"
                      type="password"
                      name="passwordConfirm"
                      placeholder="비밀번호 재입력"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      required
                    />
                  )}

                  {message && <p className="auth-message">{message}</p>}

                  <Button type="submit" fullWidth>
                    {isLogin ? '로그인' : '회원가입'}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </Container>
    </Layout>
  );
}

export default AuthPage;
