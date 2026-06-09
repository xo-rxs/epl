import { useState } from 'react';

/**
 * useLocalStorage 훅
 * LocalStorage와 React State를 동기화하는 커스텀 훅
 * @param {string} key - LocalStorage 키
 * @param {any} initialValue - 초기값
 * @returns {[any, function]} - [값, 설정함수]
 */
function useLocalStorage(key, initialValue) {
  // 상태 초기화
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // LocalStorage에서 값 가져오기
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
      return initialValue;
    } catch (error) {
      console.error(`LocalStorage 접근 오류 (${key}):`, error);
      return initialValue;
    }
  });

  // LocalStorage에 값 저장
  const setValue = (value) => {
    try {
      // 함수가 전달된 경우 실행
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`LocalStorage 저장 오류 (${key}):`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
