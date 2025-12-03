import { RegisterInput } from '@/lib/validations/auth';

export async function registerUser(data: RegisterInput) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '登録に失敗しました');
  }

  return result;
}

