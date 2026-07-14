export const MIN_PASSWORD_LENGTH = 12;

export function getPasswordValidationMessage(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Inclua letra maiúscula, minúscula, número e símbolo.';
  }

  return null;
}

export function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login') || normalizedMessage.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (normalizedMessage.includes('already registered') || normalizedMessage.includes('already been registered')) {
    return 'Esse e-mail ja esta registrado.';
  }

  if (normalizedMessage.includes('captcha')) {
    return 'Conclua a verificação de segurança e tente novamente.';
  }

  if (normalizedMessage.includes('same password')) {
    return 'A nova senha precisa ser diferente da atual.';
  }

  if (normalizedMessage.includes('current password') || normalizedMessage.includes('current_password')) {
    return 'A senha atual esta incorreta.';
  }

  if (normalizedMessage.includes('password')) {
    return 'A senha não atende aos requisitos de segurança.';
  }

  if (normalizedMessage.includes('rate limit') || normalizedMessage.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }

  if (normalizedMessage.includes('otp') || normalizedMessage.includes('challenge')) {
    return 'O código informado e inválido ou expirou.';
  }

  return 'Não foi possível concluir a autenticação agora.';
}
