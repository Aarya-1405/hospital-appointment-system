// Keeps "who is logged in" in one place so every page can read it with useAuth().
import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, getMe, setToken, clearToken, getStoredToken } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Where each role lands after logging in
export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor-dashboard' : '/doctors');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token

  // On page load: if a token is saved, ask the server who it belongs to
  useEffect(() => {
    if (!getStoredToken()) { setLoading(false); return; }
    getMe().then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (form) => {
    const data = await registerUser(form);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => { clearToken(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
