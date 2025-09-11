// src/auth/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();

  // 로그인 안 돼있으면 /login으로 이동
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 로그인된 유저만 children(보호된 페이지)을 볼 수 있음
  return children;
}
