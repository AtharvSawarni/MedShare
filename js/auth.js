const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function showFieldError(input, message) {
  input.classList.add('invalid');
  const span = document.createElement('span');
  span.className = 'field-error';
  span.textContent = message;
  input.insertAdjacentElement('afterend', span);
}

function validateAuth(form, needName) {
  clearFieldErrors(form);
  let ok = true;

  if (needName) {
    const name = form.elements.namedItem('name');
    if (!name.value.trim()) {
      showFieldError(name, 'Enter your name');
      ok = false;
    }
  }

  const email = form.elements.namedItem('email');
  if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
    showFieldError(email, 'Enter a valid email address');
    ok = false;
  }

  const password = form.elements.namedItem('password');
  if (password.value.length < 6) {
    showFieldError(password, 'Password must be at least 6 characters');
    ok = false;
  }
  return ok;
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateAuth(loginForm, false)) return;
  console.log('login valid');
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateAuth(registerForm, true)) return;
  console.log('register valid');
});