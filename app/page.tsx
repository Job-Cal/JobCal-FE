'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { CalendarDays, Link2, List, PencilLine, User } from 'lucide-react';
import JobCalendar from '@/components/calendar/JobCalendar';
import JobAddModal, { AddMode } from '@/components/job/JobAddModal';
import JobDetailPanel from '@/components/job/JobDetailPanel';
import { applicationsApi, authApi } from '@/lib/api';
import {
  Application,
  ApplicationStatus,
  ApplicationStatusLabels,
  ApplicationStatusStyles,
} from '@/types/application';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export default function Home() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<AddMode>('parse');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'deadlineAsc' | 'deadlineDesc' | 'companyAsc'>(
    'deadlineAsc'
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const showToast = (type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) return;
      if (event.target instanceof Node && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const fetchApplications = async (options?: { showLoading?: boolean }) => {
    try {
      const showLoading = options?.showLoading ?? true;
      if (showLoading) {
        setIsLoading(true);
      }
      const data = await applicationsApi.getAll();
      setIsAuthenticated(true);
      console.log('Fetched applications:', data);
      console.log('Applications with deadlines:', data.filter(app => app.job_posting.deadline));
      setApplications(data);
      if (selectedApplication) {
        const updatedSelection = data.find(app => app.id === selectedApplication.id) || null;
        setSelectedApplication(updatedSelection);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setIsAuthenticated(false);
      } else if (axios.isCancel(error)) {
        setIsAuthenticated(false);
      } else {
        console.error('Failed to fetch applications:', error);
      }
    } finally {
      if (options?.showLoading ?? true) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      fetchApplications({ showLoading: true });
    };

    bootstrap();
  }, []);

  const handleSelectEvent = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedApplication(null);
  };

  const openAddModal = (mode: AddMode) => {
    setAddModalMode(mode);
    setIsAddModalOpen(true);
  };

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = applications.filter((app) => {
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0
        || app.job_posting.company_name.toLowerCase().includes(normalizedQuery)
        || app.job_posting.job_title.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'companyAsc') {
        return a.job_posting.company_name.localeCompare(b.job_posting.company_name, 'ko');
      }

      const aTime = a.job_posting.deadline ? new Date(a.job_posting.deadline).getTime() : Infinity;
      const bTime = b.job_posting.deadline ? new Date(b.job_posting.deadline).getTime() : Infinity;

      if (sortOption === 'deadlineAsc') {
        return aTime - bTime;
      }
      return bTime - aTime;
    });

    return sorted;
  }, [applications, searchQuery, sortOption, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="surface-card w-full max-w-lg p-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">로그인이 필요합니다</h1>
          <p className="mt-2 text-slate-600">
            잡칼을 사용하려면 코그니토 로그인이 필요합니다. 아래 버튼을 눌러 로그인해 주세요.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                window.location.href = authApi.getLoginUrl();
              }}
              className="w-full rounded-2xl bg-[#136fbd] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#0e5a99] shadow-[0_12px_24px_rgba(19,111,189,0.28)]"
            >
              코그니토로 로그인
            </button>
            <button
              onClick={() => fetchApplications({ showLoading: true })}
              className="w-full rounded-2xl border border-[#cfd8e3] bg-white/80 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-white"
            >
              다시 시도
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            로그인 완료 후 이 화면으로 다시 돌아오면 자동으로 세션이 인식됩니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-0 md:py-0">
        <div className="-mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/jobcal-logo.png"
              alt="JobCal logo"
              width={112}
              height={112}
              className="h-[112px] w-[112px] rounded-xl object-contain"
              priority
            />
            <div className="flex h-[112px] flex-col justify-center leading-none">
              <h1 className="text-3xl font-black tracking-tight text-[#132033] md:text-4xl">JobCal</h1>
              <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#58677c] md:text-sm">
                Never Miss a Deadline
              </p>
            </div>
          </div>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#cfd8e3] bg-white/85 text-[#435067] transition-colors hover:border-[#136fbd] hover:text-[#0e5a99]"
              aria-label="프로필 메뉴"
            >
              <User size={18} />
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-[#cfd8e3] bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-[#eef5fc]"
                >
                  마이페이지
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileMenuOpen(false);
                    await authApi.logout();
                    setIsAuthenticated(false);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="surface-card px-6 pb-6 pt-4">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl border border-[#cfd8e3] bg-white/90 p-1">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-label="달력 모드"
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-[#136fbd] text-white'
                    : 'text-slate-700 hover:bg-[#eef5fc]'
                }`}
              >
                <CalendarDays size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="전체 지원 현황 모드"
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#136fbd] text-white'
                    : 'text-slate-700 hover:bg-[#eef5fc]'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddModal('parse')}
                aria-label="URL 파싱 추가"
                title="URL 파싱 추가"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#136fbd] text-white transition-colors hover:bg-[#0e5a99] shadow-[0_10px_22px_rgba(19,111,189,0.28)]"
              >
                <Link2 size={16} />
              </button>
              <button
                onClick={() => openAddModal('manual')}
                aria-label="수동 추가"
                title="수동 추가"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#cfd8e3] bg-white/90 text-slate-700 transition-colors hover:bg-[#eef5fc]"
              >
                <PencilLine size={16} />
              </button>
            </div>
          </div>

          <div className={viewMode === 'calendar' ? 'block' : 'hidden'} aria-hidden={viewMode !== 'calendar'}>
            <JobCalendar applications={applications} onSelectEvent={handleSelectEvent} />
          </div>

          <div className={viewMode === 'list' ? 'block' : 'hidden'} aria-hidden={viewMode !== 'list'}>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="회사명/직무 검색"
                className="w-full rounded-2xl border border-[#cfd8e3] bg-white/90 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#136fbd] focus:outline-none focus:ring-2 focus:ring-[#9dcff9]"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'ALL')}
                className="w-full rounded-2xl border border-[#cfd8e3] bg-white/90 px-4 py-2 text-sm text-slate-700 focus:border-[#136fbd] focus:outline-none focus:ring-2 focus:ring-[#9dcff9]"
              >
                <option value="ALL">전체 상태</option>
                {Object.values(ApplicationStatus).map((status) => (
                  <option key={status} value={status}>
                    {ApplicationStatusLabels[status]}
                  </option>
                ))}
              </select>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as 'deadlineAsc' | 'deadlineDesc' | 'companyAsc')}
                className="w-full rounded-2xl border border-[#cfd8e3] bg-white/90 px-4 py-2 text-sm text-slate-700 focus:border-[#136fbd] focus:outline-none focus:ring-2 focus:ring-[#9dcff9]"
              >
                <option value="deadlineAsc">마감일 빠른순</option>
                <option value="deadlineDesc">마감일 늦은순</option>
                <option value="companyAsc">회사명 가나다순</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#dbe6f2]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#edf4fb]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#58677c] uppercase tracking-wider">
                        회사명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#58677c] uppercase tracking-wider">
                        직무
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#58677c] uppercase tracking-wider">
                        마감일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-[#58677c] uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6eef8] bg-white">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                          {applications.length === 0
                            ? '등록된 채용 공고가 없습니다.'
                            : '현재 필터 조건에 맞는 공고가 없습니다.'}
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr
                          key={app.id}
                          className="cursor-pointer transition-colors hover:bg-[#f2f7fd]"
                          onClick={() => handleSelectEvent(app)}
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                            {app.job_posting.company_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {app.job_posting.job_title}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {app.job_posting.deadline
                              ? new Date(app.job_posting.deadline).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className="rounded-full px-2 py-1 text-xs font-bold"
                              style={{
                                backgroundColor: ApplicationStatusStyles[app.status].bg,
                                color: ApplicationStatusStyles[app.status].text,
                                border: `1px solid ${ApplicationStatusStyles[app.status].border}`,
                              }}
                            >
                              {ApplicationStatusLabels[app.status]}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <JobAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchApplications({ showLoading: true })}
        initialMode={addModalMode}
        onNotify={showToast}
      />

      <JobDetailPanel
        application={selectedApplication}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        onUpdate={() => fetchApplications({ showLoading: false })}
        onNotify={showToast}
      />

      <div className="fixed right-4 top-4 z-[70] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[240px] max-w-[360px] rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-700'
                : 'border-rose-200 bg-rose-50/95 text-rose-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </main>
  );
}
