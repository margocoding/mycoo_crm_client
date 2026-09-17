export function passwordRules(password: string) {
  return [
    { ok: password.length >= 8 && password.length <= 128, label: 'от 8 до 128 символов' },
    { ok: /\d/.test(password) && /[a-zа-яё]/i.test(password), label: 'буквы и цифры' },
    { ok: /[A-ZА-ЯЁ]/.test(password) && /[a-zа-яё]/.test(password), label: 'разный регистр букв' },
  ];
}

export function passwordStrength(password: string) {
  const strength = passwordRules(password).filter((r) => r.ok).length
    + (password.length >= 12 ? 1 : 0) + (/[^a-zа-яё0-9]/i.test(password) ? 1 : 0);
  if (strength <= 1) return { label: 'слабый', color: 'var(--color-crit)', w: '25%' };
  if (strength === 2) return { label: 'средний', color: 'var(--color-warn)', w: '50%' };
  if (strength <= 4) return { label: 'сильный', color: 'var(--color-ok)', w: '78%' };
  return { label: 'отличный', color: 'var(--color-flux)', w: '100%' };
}
