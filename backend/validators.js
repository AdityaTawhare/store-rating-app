function validateName(name) {
  if (typeof name !== 'string') return false;
  const len = name.trim().length;
  return len >= 20 && len <= 60;
}

function validateAddress(address) {
  if (typeof address !== 'string') return false;
  const len = address.trim().length;
  return len >= 1 && len <= 400;
}

function validatePassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 16) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-\[\]\\/;'`~+=]/.test(password);
  return hasUpper && hasSpecial;
}

function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

module.exports = { validateName, validateAddress, validatePassword, validateEmail };

