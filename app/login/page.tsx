'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace('/');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white/90 backdrop-blur rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] p-8 border border-[#e5edff]">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">로그인이 필요합니다</h1>
        <p className="text-slate-600 mt-2">
          JobCal을 사용하려면 로그인해 주세요. 아래 버튼을 누르면 인증 페이지로 이동합니다.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              window.location.href = authApi.getLoginUrl();
            }}
            className="w-full bg-primary-600 text-white px-5 py-3 rounded-full font-semibold hover:bg-primary-500 transition-colors shadow-[0_10px_24px_rgba(37,99,235,0.25)]"
          >
            코그니토로 로그인
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full border border-slate-200 text-slate-700 px-5 py-3 rounded-full font-semibold hover:bg-slate-50 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}
