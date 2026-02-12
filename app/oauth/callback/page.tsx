'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const setCookie = (name: string, value: string) => {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax'];
  if (window.location.protocol === 'https:') {
    parts.push('Secure');
  }
  document.cookie = parts.join('; ');
};

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const accessToken = url.searchParams.get('accessToken');
    const refreshToken = url.searchParams.get('refreshToken');

    if (!accessToken && !refreshToken) {
      setError('토큰이 없습니다. 다시 로그인해 주세요.');
      return;
    }

    if (accessToken) {
      setCookie('accessToken', accessToken);
    }
    if (refreshToken) {
      setCookie('refreshToken', refreshToken);
    }

    router.replace('/');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] p-8 border border-[#e5edff] text-center">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {error ? '로그인 실패' : '로그인 처리 중...'}
        </h1>
        <p className="text-slate-600 mt-3">
          {error ?? '잠시만 기다려 주세요.'}
        </p>
      </div>
    </main>
  );
}
