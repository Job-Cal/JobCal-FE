'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const token = getAuthToken();
      if (token) {
        router.replace('/');
        return;
      }

      const refreshed = await authApi.fetchAccessToken();
      if (refreshed) {
        router.replace('/');
        return;
      }

      if (isMounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isBootstrapping) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-lg p-8">
          <h1 className="text-3xl font-black tracking-tight text-[#132033]">세션 확인 중</h1>
          <p className="mt-2 text-slate-600">
            로그인 정보를 확인하고 있습니다. 잠시만 기다려 주세요.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="surface-card w-full max-w-lg p-8">
        <h1 className="text-3xl font-black tracking-tight text-[#132033]">로그인이 필요합니다</h1>
        <p className="mt-2 text-slate-600">
          JobCal을 사용하려면 로그인해 주세요. 구글 계정으로 빠르게 로그인할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => {
              window.location.href = authApi.getLoginUrl();
            }}
            className="w-full rounded-2xl border border-[#d1d5db] bg-white px-5 py-3 font-semibold text-[#111827] transition-colors hover:bg-[#f9fafb] shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
          >
            Google로 계속하기
          </button>
        </div>
      </div>
    </main>
  );
}
