/**
 * Auth Module - Login/Register handling
 */
const Auth = (() => {
  let currentUser = null;

  function init() {
    const token = localStorage.getItem('pm_token');
    if (!token) {
      showLoginModal();
    } else {
      onAuthenticated();
    }

    window.addEventListener('auth:required', () => {
      showLoginModal();
    });
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

    const btn = document.getElementById(`auth-${mode}-btn`);
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Please wait...';

    try {
      let result;
      if (mode === 'login') {
        result = await API.auth.login(email, password);
      } else {
        const name = document.getElementById('auth-name').value.trim() || 'User';
        result = await API.auth.register(email, password, name);
      }
      localStorage.setItem('pm_token', result.token);
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
    // Initialize other modules
    Workspace.init();
  }

  function logout() {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_workspace');
    location.reload();
  }

  function toggleAuthMode() {
    const loginFields = document.getElementById('auth-login-fields');
    const registerFields = document.getElementById('auth-register-fields');
    const loginBtn = document.getElementById('auth-login-btn');
    const registerBtn = document.getElementById('auth-register-btn');
    const title = document.getElementById('auth-modal-title');
    const toggleLink = document.getElementById('auth-toggle');

    if (registerFields.classList.contains('hidden')) {
      // Switch to register mode
      registerFields.classList.remove('hidden');
      loginBtn.classList.add('hidden');
      registerBtn.classList.remove('hidden');
      title.textContent = 'Create Account';
      toggleLink.innerHTML = 'Already have an account? <a href="#" onclick="Auth.toggleAuthMode(); return false;">Login</a>';
    } else {
      // Switch to login mode
      registerFields.classList.add('hidden');
      loginBtn.classList.remove('hidden');
      registerBtn.classList.add('hidden');
      title.textContent = 'Welcome Back';
      toggleLink.innerHTML = 'Don\'t have an account? <a href="#" onclick="Auth.toggleAuthMode(); return false;">Register</a>';
    }
  }

  return { init, handleSubmit, logout, toggleAuthMode, showLoginModal };
})();

window.Auth = Auth;
