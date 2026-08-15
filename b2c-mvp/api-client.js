(() => {
  const TOKEN_KEY = 'ttai-access-token';
  const USER_KEY = 'ttai-user';
  const SESSION_KEY = 'ttai-study-session-id';
  const API_KEY = 'ttai-api-base';

  const defaultBase = window.TTAI_API_BASE || localStorage.getItem(API_KEY) || 'http://127.0.0.1:8001';

  function base() {
    return (localStorage.getItem(API_KEY) || window.TTAI_API_BASE || defaultBase).replace(/\/$/, '');
  }
  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function user() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch (_) { return null; }
  }
  function cacheUser(nextUser) {
    if (!nextUser) return;
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem('ttai-profile', JSON.stringify(nextUser));
  }
  function setSession(auth) {
    if (auth?.access_token) localStorage.setItem(TOKEN_KEY, auth.access_token);
    if (auth?.user) cacheUser(auth.user);
  }
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
  function assetUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
    return `${base()}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (token()) headers.set('Authorization', `Bearer ${token()}`);
    let response;
    try {
      response = await fetch(`${base()}${path}`, { ...options, headers });
    } catch (error) {
      const e = new Error('백엔드 서버에 연결할 수 없습니다. API 배포 주소를 확인해 주세요.');
      e.cause = error;
      e.code = 'NETWORK';
      throw e;
    }
    let data = null;
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) {
      if (response.status === 401) logout();
      const e = new Error(data?.detail || `요청에 실패했습니다. (${response.status})`);
      e.status = response.status;
      e.data = data;
      throw e;
    }
    return data;
  }

  window.TTAI = {
    base,
    assetUrl,
    setApiBase(value) { localStorage.setItem(API_KEY, value.replace(/\/$/, '')); },
    token,
    user,
    cacheUser,
    setSession,
    logout,
    isLoggedIn: () => !!token(),
    register: data => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }).then(x => (setSession(x), x)),
    login: data => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }).then(x => (setSession(x), x)),
    me: () => request('/api/me'),
    profilePhoto: () => request('/api/me/photo'),
    uploadProfilePhoto: file => {
      const form = new FormData();
      form.append('file', file, file.name || 'profile.jpg');
      return request('/api/me/photo', { method: 'POST', body: form }).then(x => {
        if (x?.user) cacheUser(x.user);
        return x;
      });
    },
    growth: () => request('/api/growth/me'),
    curriculumProgress: subject => request(`/api/curriculum/progress/me${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`),
    curriculumMap: params => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/api/curriculum/map${q ? `?${q}` : ''}`);
    },
    createStudySession: data => request('/api/study/sessions', { method: 'POST', body: JSON.stringify(data) }).then(x => (localStorage.setItem(SESSION_KEY, x.id), x)),
    currentStudySessionId: () => Number(localStorage.getItem(SESSION_KEY) || 0) || null,
    sendMessage: (sessionId, content, meta = {}) => request(`/api/study/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify({ content, meta }) }),
    listMessages: sessionId => request(`/api/study/sessions/${sessionId}/messages`),
    growthEvent: (kind, amount = 1) => request('/api/growth/events', { method: 'POST', body: JSON.stringify({ kind, amount }) }),
    request
  };
})();
