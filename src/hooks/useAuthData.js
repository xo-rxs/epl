import { useCallback, useEffect, useState } from 'react';

const USERS_KEY = 'epl_users';
const CURRENT_USER_KEY = 'epl_current_user';
const AUTH_EVENT_NAME = 'epl_auth_change';
const POSITION_OPTIONS = ['GK', 'DF', 'MF', 'FW'];

const readJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`LocalStorage 인증 데이터 읽기 오류 (${key}):`, error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const hashPassword = (password) => {
  let hash = 5381;

  for (let index = 0; index < password.length; index += 1) {
    hash = (hash * 33) ^ password.charCodeAt(index);
  }

  return `local_${(hash >>> 0).toString(16)}`;
};

const buildPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name || user.nickname,
  nickname: user.nickname || user.name,
  age: user.age,
  preferredPosition: user.preferredPosition,
  skillTier: user.skillTier,
  createdAt: user.createdAt,
});

/**
 * useAuthData 훅
 * LocalStorage 기반 회원가입, 로그인, 로그아웃 상태를 관리한다.
 */
function useAuthData() {
  const [users, setUsers] = useState(() => readJson(USERS_KEY, []));
  const [currentUser, setCurrentUser] = useState(() =>
    readJson(CURRENT_USER_KEY, null)
  );

  const syncAuthState = useCallback(() => {
    setUsers(readJson(USERS_KEY, []));
    setCurrentUser(readJson(CURRENT_USER_KEY, null));
  }, []);

  useEffect(() => {
    window.addEventListener(AUTH_EVENT_NAME, syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, [syncAuthState]);

  const notifyAuthChange = () => {
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  };

  const signUp = useCallback((formData) => {
    const email = normalizeEmail(formData.email || '');
    const name = (formData.name || '').trim();
    const age = Number(formData.age);
    const preferredPosition = formData.preferredPosition || '';
    const password = formData.password || '';
    const passwordConfirm = formData.passwordConfirm || '';
    const savedUsers = readJson(USERS_KEY, []);

    if (!isValidEmail(email)) {
      return { ok: false, message: '올바른 이메일을 입력해주세요.' };
    }

    if (name.length < 2) {
      return { ok: false, message: '이름은 2자 이상 입력해주세요.' };
    }

    if (!Number.isInteger(age) || age < 8 || age > 80) {
      return { ok: false, message: '나이는 8세부터 80세까지 입력할 수 있습니다.' };
    }

    if (!POSITION_OPTIONS.includes(preferredPosition)) {
      return { ok: false, message: '선호 포지션을 선택해주세요.' };
    }

    if (password.length < 6) {
      return { ok: false, message: '비밀번호는 6자 이상 입력해주세요.' };
    }

    if (password !== passwordConfirm) {
      return { ok: false, message: '비밀번호 확인이 일치하지 않습니다.' };
    }

    if (savedUsers.some((user) => user.email === email)) {
      return { ok: false, message: '이미 가입된 이메일입니다.' };
    }

    const newUser = {
      id: `user_${Date.now()}`,
      email,
      name,
      nickname: name,
      age,
      preferredPosition,
      skillTier: null,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    const publicUser = buildPublicUser(newUser);
    const nextUsers = [newUser, ...savedUsers];

    writeJson(USERS_KEY, nextUsers);
    writeJson(CURRENT_USER_KEY, publicUser);
    setUsers(nextUsers);
    setCurrentUser(publicUser);
    notifyAuthChange();

    return { ok: true, user: publicUser };
  }, []);

  const login = useCallback((formData) => {
    const email = normalizeEmail(formData.email || '');
    const password = formData.password || '';
    const passwordHash = hashPassword(password);
    const savedUsers = readJson(USERS_KEY, []);
    const user = savedUsers.find(
      (item) =>
        item.email === email &&
        (item.passwordHash === passwordHash || item.password === password)
    );

    if (!user) {
      return { ok: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    const publicUser = buildPublicUser(user);
    writeJson(CURRENT_USER_KEY, publicUser);
    setCurrentUser(publicUser);
    notifyAuthChange();

    return { ok: true, user: publicUser };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
    notifyAuthChange();
  }, []);

  /**
   * 프로필 수정 (선호 포지션, 스킬 티어)
   */
  const updateProfile = useCallback((updates) => {
    const savedCurrentUser = readJson(CURRENT_USER_KEY, null);

    if (!savedCurrentUser) {
      return { ok: false, message: '로그인 후 이용할 수 있습니다.' };
    }

    const nextProfile = {};

    if (updates.preferredPosition !== undefined) {
      if (!POSITION_OPTIONS.includes(updates.preferredPosition)) {
        return { ok: false, message: '선호 포지션을 선택해주세요.' };
      }
      nextProfile.preferredPosition = updates.preferredPosition;
    }

    const savedUsers = readJson(USERS_KEY, []);
    const nextUsers = savedUsers.map((user) =>
      user.id === savedCurrentUser.id ? { ...user, ...nextProfile } : user
    );
    const nextCurrentUser = { ...savedCurrentUser, ...nextProfile };

    writeJson(USERS_KEY, nextUsers);
    writeJson(CURRENT_USER_KEY, nextCurrentUser);
    setUsers(nextUsers);
    setCurrentUser(nextCurrentUser);
    notifyAuthChange();

    return { ok: true, user: nextCurrentUser };
  }, []);

  return {
    users,
    currentUser,
    isAuthenticated: Boolean(currentUser),
    signUp,
    login,
    logout,
    updateProfile,
  };
}

export default useAuthData;
