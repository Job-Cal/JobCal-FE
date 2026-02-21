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
      <div className="surface-card w-full max-w-lg p-8">
        <h1 className="text-3xl font-black tracking-tight text-[#132033]">로그인이 필요합니다</h1>
        <p className="mt-2 text-slate-600">
          JobCal을 사용하려면 로그인해 주세요. 아래 버튼을 누르면 인증 페이지로 이동합니다.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              window.location.href = authApi.getLoginUrl();
            }}
            className="w-full rounded-2xl bg-[#136fbd] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#0e5a99] shadow-[0_10px_24px_rgba(19,111,189,0.25)]"
          >
            코그니토로 로그인
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-2xl border border-[#cfd8e3] bg-white/80 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-white"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </main>
  );
}
