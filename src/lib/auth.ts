export interface AppUser {
  username: string;
  role: string;
  name: string;
  active: boolean;
}

const TOKEN_KEY = 'backend_auth_token';
const USER_KEY = 'backend_auth_user';

export async function login(email: string, password: string): Promise<AppUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication rejected');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.replace(/^Bearer /, '').split('.')[1]));
    return typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function getStoredSession(): AppUser | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (!token || !userJson || isTokenExpired(token)) {
    logout();
    return null;
  }
  try {
    return JSON.parse(userJson) as AppUser;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function fetchUsers(): Promise<AppUser[]> {
  const token = getAuthToken();
  const res = await fetch('/api/auth/users', {
    headers: { Authorization: token || '' },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(email: string, password: string, role: string, name: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token || '' },
    body: JSON.stringify({ email, password, role, name }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to create user');
  }
}

export async function updateUser(email: string, updates: { role?: string; name?: string }): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`/api/auth/users/${encodeURIComponent(email)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: token || '' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update user');
}

export async function deleteUser(email: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`/api/auth/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { Authorization: token || '' },
  });
  if (!res.ok) throw new Error('Failed to delete user');
}

export async function resetPassword(email: string, password: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`/api/auth/users/${encodeURIComponent(email)}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: token || '' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Failed to reset password');
}

export async function setUserActive(email: string, active: boolean): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`/api/auth/users/${encodeURIComponent(email)}/active`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: token || '' },
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error('Failed to update user status');
}
