/**
 * 데이터 검증 유틸리티
 */

/**
 * 이메일 유효성 검사
 * @param {string} email - 이메일 주소
 * @returns {boolean} - 유효 여부
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 닉네임 유효성 검사
 * @param {string} nickname - 닉네임
 * @returns {boolean} - 유효 여부 (2-20자, 한글/영문/숫자)
 */
export const isValidNickname = (nickname) => {
  const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,20}$/;
  return nicknameRegex.test(nickname);
};

/**
 * 숫자 범위 검사
 * @param {number} value - 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {boolean} - 유효 여부
 */
export const isInRange = (value, min, max) => {
  return value >= min && value <= max;
};

/**
 * 필수 필드 검사
 * @param {any} value - 값
 * @returns {boolean} - 필수 필드 유효 여부
 */
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * 폼 필드 검증
 * @param {object} values - 입력값
 * @param {object} rules - 검증 규칙 {fieldName: [rule, rule, ...]}
 * @returns {object} - 에러 객체
 */
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = values[field];

    fieldRules.forEach((rule) => {
      if (!rule.validate(value)) {
        errors[field] = rule.message;
      }
    });
  });

  return errors;
};

/**
 * 검증 규칙 팩토리
 */
export const validators = {
  required: (message = '필수 입력 항목입니다.') => ({
    validate: isRequired,
    message,
  }),

  email: (message = '유효한 이메일이 아닙니다.') => ({
    validate: isValidEmail,
    message,
  }),

  nickname: (message = '닉네임은 2-20자의 한글/영문/숫자만 가능합니다.') => ({
    validate: isValidNickname,
    message,
  }),

  minLength: (min, message = `최소 ${min}자 이상이어야 합니다.`) => ({
    validate: (value) => isRequired(value) && value.length >= min,
    message,
  }),

  maxLength: (max, message = `최대 ${max}자 이하여야 합니다.`) => ({
    validate: (value) => !isRequired(value) || value.length <= max,
    message,
  }),

  range: (min, max, message = `${min}과 ${max} 사이의 값이어야 합니다.`) => ({
    validate: (value) => isInRange(value, min, max),
    message,
  }),

  custom: (validateFn, message = '입력값이 유효하지 않습니다.') => ({
    validate: validateFn,
    message,
  }),
};
