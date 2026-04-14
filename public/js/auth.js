/**
 * Auth Module - Login/Register handling with session persistence
 */
const Auth = (() => {
  let currentUser = null;

  async function init() {
    const token = localStorage.getItem('pm_token');

    // Register auth listener first
    window.addEventListener('auth:required', () => {
      currentUser = null;
      showLoginModal();
    });

    if (!token) {
      showLoginModal();
      return;
    }

    // Token exists — show app immediately, then verify in background
    const cachedUser = localStorage.getItem('pm_user');
    if (cachedUser) {
      try { currentUser = JSON.parse(cachedUser); } catch(e) {}
    }
    document.getElementById('app-layout').classList.remove('hidden');
    updateUserUI();

    // Verify token is still valid
    try {
      currentUser = await API.auth.getMe();
      localStorage.setItem('pm_user', JSON.stringify(currentUser));
      updateUserUI();
      Workspace.init();
    } catch (err) {
      console.warn('Token validation failed:', err.message);
      if (err.message === 'Session expired') {
        // Token truly invalid
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        currentUser = null;
        showLoginModal();
      } else {
        // Network error — use cached data and still load app
        if (currentUser) {
          Workspace.init();
        } else {
          showLoginModal();
        }
      }
    }
  }

  function showLoginModal() {
    document.getElementById('app-layout').classList.add('hidden');
    document.getElementById('auth-modal').classList.remove('modal-overlay--hidden');
    document.getElementById('auth-error').textContent = '';
  }

  function hideLoginModal() {
    document.getElementById('auth-modal').classList.add('modal-overlay--hidden');
    document.getElementById('app-layout').classList.remove('hidden');
  }

  async function handleSubmit(mode) {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const errorEl = document.getElementById('auth-error');
    errorEl.textContent = '';

    if (!email || !password) {
      errorEl.textContent = 'Email and password are required';
      return;
    }

    if (mode === 'register') {
      const name = document.getElementById('auth-name').value.trim();
      if (!name) {
        errorEl.textContent = 'Name is required';
        return;
      }
    }

    const btn = document.getElementById(`auth-${mode}-btn`);
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Please wait...';

    try {
      let result;
      if (mode === 'login') {
        result = await API.auth.login(email, password);
      } else {
        const name = document.getElementById('auth-name').value.trim();
        result = await API.auth.register(email, password, name);
      }
      
      // Save token and user info
      localStorage.setItem('pm_token', result.token);
      currentUser = result.user;
      localStorage.setItem('pm_user', JSON.stringify(currentUser));
      
      hideLoginModal();
      onAuthenticated();
    } catch (err) {
      errorEl.textContent = err.message || 'Authentication failed';
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  }

  function onAuthenticated() {
    document.getElementById('app-layout').classList.remove('hidden');
    updateUserUI();
    Workspace.init();
  }

  function updateUserUI() {
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-display-name');
    
    if (currentUser) {
      const initials = (currentUser.name || currentUser.email || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      
      if (avatarEl) avatarEl.textContent = initials;
      if (nameEl) nameEl.textContent = currentUser.name || currentUser.email;
    }
  }

  function logout() {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_workspace');
    localStorage.removeItem('pm_env');
    currentUser = null;
    location.reload();
  }

  function toggleAuthMode() {
    const registerFields = document.getElementById('auth-register-fields');
    const loginBtn = document.getElementById('auth-login-btn');
    const registerBtn = document.getElementById('auth-register-btn');
    const title = document.getElementById('auth-modal-title');
    const toggleLink = document.getElementById('auth-toggle');

    if (registerFields.classList.contains('hidden')) {
      registerFields.classList.remove('hidden');
      loginBtn.classList.add('hidden');
      registerBtn.classList.remove('hidden');
      title.textContent = 'Create Account';
      toggleLink.innerHTML = 'Already have an account? <a href="#" onclick="Auth.toggleAuthMode(); return false;" style="color:var(--accent-primary);">Login</a>';
    } else {
      registerFields.classList.add('hidden');
      loginBtn.classList.remove('hidden');
      registerBtn.classList.add('hidden');
      title.textContent = 'Welcome Back';
      toggleLink.innerHTML = 'Don\'t have an account? <a href="#" onclick="Auth.toggleAuthMode(); return false;" style="color:var(--accent-primary);">Register</a>';
    }
  }

  function getUser() {
    return currentUser;
  }

  return { init, handleSubmit, logout, toggleAuthMode, showLoginModal, getUser };
})();

window.Auth = Auth;
