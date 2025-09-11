// src/auth/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

// 로그인 가능한 고정 유저 정보
const USERS = {
  aunty: "mypassword",
  guest: "demo1234",
};

// Context 객체 생성: Provider와 useContext()로 로그인 정보 공유하는 데 사용됨.
const AuthContext = createContext();

// Provider 컴포넌트(인증 정보를 모든 컴포넌트에 제공)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // 유저 상태 관리

  // localStorage에 저장된 로그인 정보 불러오기: 컴포넌트가 처음 렌더링 될 때, localStorage에 저장된 로그인 정보가 있을 시, 자동으로 로그인 상태 복구함.
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 로그인 함수
  function login(username, password) {
    if (USERS[username] && USERS[username] === password) {
      const userObj = { username };
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
      return { success: true };
    } else {
      return { success: false, message: "Invalid credentials" };
    }
  }

  // 로그아웃 함수
  function logout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  return (
    // AuthContext.Provider: Context의 값을 하위 컴포넌트에 전달함
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 커스텀 훅
export function useAuth() {
  return useContext(AuthContext);
}
