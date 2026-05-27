import { useState, useCallback } from 'react';

/**
 * useForm 훅
 * 폼 상태 관리를 간단하게 해주는 커스텀 훅
 * @param {object} initialValues - 폼 초기값
 * @param {function} onSubmit - 제출 핸들러
 * @returns {object} - {values, errors, handleChange, handleSubmit, setFieldValue, reset}
 */
function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 필드 값 변경
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // 입력 시 에러 제거
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  }, [errors]);

  // 특정 필드 설정
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 필드 에러 설정
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  // 폼 제출
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('폼 제출 오류:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  // 폼 초기화
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    setFieldValue,
    setFieldError,
    handleChange,
    handleSubmit,
    reset,
    isSubmitting,
  };
}

export default useForm;
