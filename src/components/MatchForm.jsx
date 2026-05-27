import Button from './Button';
import Input from './Input';
import Card from './Card';
import { useForm } from '../hooks';

/**
 * MatchForm 컴포넌트
 * 경기 정보 입력 폼
 * @param {function} onSubmit - 폼 제출 핸들러
 * @param {boolean} loading - 로딩 상태
 */
function MatchForm({ onSubmit, loading = false }) {
  const form = useForm(
    {
      title: '',
      location: '',
      datetime: '',
      maxParticipants: 20,
      description: '',
    },
    onSubmit
  );

  const validateForm = () => {
    const errors = {};

    if (!form.values.title.trim()) {
      errors.title = '경기명은 필수입니다.';
    }
    if (!form.values.location.trim()) {
      errors.location = '장소는 필수입니다.';
    }
    if (!form.values.datetime) {
      errors.datetime = '날짜와 시간은 필수입니다.';
    }
    if (form.values.maxParticipants < 2 || form.values.maxParticipants > 50) {
      errors.maxParticipants = '참가 인원은 2명 이상 50명 이하여야 합니다.';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      Object.entries(formErrors).forEach(([field, error]) => {
        form.setFieldError(field, error);
      });
      return;
    }

    form.handleSubmit(e);
  };

  return (
    <Card
      header={<h3 className="card-header-title">📅 새 경기 생성</h3>}
      footer={
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', justifyContent: 'flex-end', width: '100%' }}>
          <Button
            variant="secondary"
            onClick={form.reset}
            disabled={loading}
          >
            초기화
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            onClick={handleSubmit}
          >
            경기 생성
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="경기명"
          placeholder="예: 수요일 저녁 축구"
          value={form.values.title}
          onChange={form.handleChange}
          error={form.errors.title}
          hint="경기의 이름을 입력해주세요."
          name="title"
          required
        />

        <Input
          label="장소"
          placeholder="예: 여의도 공원"
          value={form.values.location}
          onChange={form.handleChange}
          error={form.errors.location}
          hint="경기 장소를 입력해주세요."
          name="location"
          required
        />

        <Input
          label="날짜 및 시간"
          type="datetime-local"
          value={form.values.datetime}
          onChange={form.handleChange}
          error={form.errors.datetime}
          name="datetime"
          required
        />

        <Input
          label="최대 참가 인원"
          type="number"
          min="2"
          max="50"
          value={form.values.maxParticipants}
          onChange={form.handleChange}
          error={form.errors.maxParticipants}
          hint="2명 이상 50명 이하로 설정하세요."
          name="maxParticipants"
          required
        />

        <Input
          label="설명 (선택)"
          placeholder="경기에 대한 추가 정보를 입력하세요."
          value={form.values.description}
          onChange={form.handleChange}
          hint="예: 초급자 환영, 풋살 경기 등"
          name="description"
        />
      </form>
    </Card>
  );
}

export default MatchForm;
