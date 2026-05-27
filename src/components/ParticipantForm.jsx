import Button from './Button';
import Input from './Input';
import Card from './Card';
import { useForm } from '../hooks';

/**
 * ParticipantForm 컴포넌트
 * 참여자 등록 폼
 * @param {function} onSubmit - 폼 제출 핸들러 (participantData 전달)
 * @param {number} currentCount - 현재 참여자 수
 * @param {number} maxCount - 최대 참가자 수
 * @param {boolean} loading - 로딩 상태
 */
function ParticipantForm({ onSubmit, currentCount = 0, maxCount = 20, loading = false }) {
  const isFull = currentCount >= maxCount;

  const form = useForm(
    {
      nickname: '',
      year: 1,
      position: 'MF',
      skillScore: 3,
    },
    onSubmit
  );

  const validateForm = () => {
    const errors = {};

    if (!form.values.nickname.trim()) {
      errors.nickname = '닉네임은 필수입니다.';
    } else if (form.values.nickname.length < 2 || form.values.nickname.length > 20) {
      errors.nickname = '닉네임은 2자 이상 20자 이하여야 합니다.';
    }

    if (!form.values.year) {
      errors.year = '학년을 선택하세요.';
    }

    if (!form.values.position) {
      errors.position = '포지션을 선택하세요.';
    }

    const skillScore = Number(form.values.skillScore);
    if (Number.isNaN(skillScore) || skillScore < 1 || skillScore > 5) {
      errors.skillScore = '실력 점수는 1~5 사이여야 합니다.';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isFull) {
      alert('참가 인원이 가득 찼습니다.');
      return;
    }

    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      Object.entries(formErrors).forEach(([field, error]) => {
        form.setFieldError(field, error);
      });
      return;
    }

    form.handleSubmit(e);
    // 성공 후 폼 초기화
    form.reset();
  };

  return (
    <Card
      header={<h3 className="card-header-title">👤 참여 신청</h3>}
      footer={
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ color: 'var(--color-gray-600)', fontSize: 'var(--font-size-sm)' }}>
            참가자: {currentCount} / {maxCount}
          </span>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button
              variant="secondary"
              onClick={form.reset}
              disabled={loading || isFull}
            >
              초기화
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              onClick={handleSubmit}
              disabled={isFull}
            >
              {isFull ? '신청 불가' : '신청하기'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="닉네임"
          placeholder="예: 철수, Soccer99"
          value={form.values.nickname}
          onChange={form.handleChange}
          error={form.errors.nickname}
          hint="2자 이상 20자 이하로 입력하세요."
          name="nickname"
          required
          disabled={isFull}
        />

        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <label style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
            학년
          </label>
          <select
            name="year"
            value={form.values.year}
            onChange={form.handleChange}
            className="select-field"
            style={{
              width: '100%',
              padding: 'var(--spacing-3) var(--spacing-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-base)',
              fontSize: 'var(--font-size-base)',
            }}
            disabled={isFull}
          >
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <option key={year} value={year}>
                {year}학년
              </option>
            ))}
          </select>
          {form.errors.year && <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>{form.errors.year}</div>}
        </div>

        <div>
          <label style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
            포지션
          </label>
          <select
            name="position"
            value={form.values.position}
            onChange={form.handleChange}
            className="select-field"
            style={{
              width: '100%',
              padding: 'var(--spacing-3) var(--spacing-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-base)',
              fontSize: 'var(--font-size-base)',
            }}
            disabled={isFull}
          >
            <option value="GK">골키퍼 (GK)</option>
            <option value="DF">수비수 (DF)</option>
            <option value="MF">미드필더 (MF)</option>
            <option value="FW">공격수 (FW)</option>
          </select>
          {form.errors.position && <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>{form.errors.position}</div>}
        </div>

        <div style={{ marginTop: 'var(--spacing-4)' }}>
          <label style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-gray-700)' }}>
            실력 점수 (1~5)
          </label>
          <select
            name="skillScore"
            value={form.values.skillScore}
            onChange={form.handleChange}
            className="select-field"
            style={{
              width: '100%',
              padding: 'var(--spacing-3) var(--spacing-4)',
              border: '1px solid var(--color-gray-300)',
              borderRadius: 'var(--radius-base)',
              fontSize: 'var(--font-size-base)',
            }}
            disabled={isFull}
          >
            {[1, 2, 3, 4, 5].map((score) => (
              <option key={score} value={score}>
                {score}점
              </option>
            ))}
          </select>
          {form.errors.skillScore && (
            <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-1)' }}>
              {form.errors.skillScore}
            </div>
          )}
        </div>
      </form>

      {isFull && (
        <div style={{
          marginTop: 'var(--spacing-4)',
          padding: 'var(--spacing-3) var(--spacing-4)',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderLeft: '3px solid var(--color-error)',
          borderRadius: 'var(--radius-base)',
          color: 'var(--color-error)',
          fontSize: 'var(--font-size-sm)',
        }}>
          ⚠️ 참가 인원이 모두 찼습니다.
        </div>
      )}
    </Card>
  );
}

export default ParticipantForm;
