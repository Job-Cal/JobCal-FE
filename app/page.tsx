'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CalendarDays, Link2, List, LogIn, MessageSquareMore, PencilLine, User } from 'lucide-react';
import JobCalendar from '@/components/calendar/JobCalendar';
import JobAddModal, { AddMode } from '@/components/job/JobAddModal';
import JobDetailPanel from '@/components/job/JobDetailPanel';
import FeedbackModal from '@/components/common/FeedbackModal';
import { applicationsApi, authApi, feedbackApi } from '@/lib/api';
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

const createMockApplications = (): Application[] => {
  const nowIso = new Date().toISOString();
  const febDate = (day: number) => `2026-02-${String(day).padStart(2, '0')}`;
  const samples: Array<{
    id: number;
    company: string;
    title: string;
    day: number;
    status: ApplicationStatus;
    source: string;
    location: string;
    description: string;
  }> = [
    {
      id: 900001, company: '코딧', title: '백엔드 개발 인턴', day: 3, status: ApplicationStatus.NOT_APPLIED, source: 'https://www.wanted.co.kr', location: '서울',
      description: '주요업무\n- 정책/규제 데이터 API 개발 및 유지보수\n- Node.js 기반 서버 기능 개선\n\n자격요건\n- JavaScript/TypeScript 기본 역량\n- REST API 개발 경험\n\n우대사항\n- 데이터 크롤링/가공 경험',
    },
    {
      id: 900002, company: '메가존클라우드', title: '프로젝트 관리 지원 인턴', day: 7, status: ApplicationStatus.APPLIED, source: 'https://inthiswork.com', location: '경기',
      description: '주요업무\n- 프로젝트 일정/이슈 관리 보조\n- 주간 리포트 작성 및 커뮤니케이션 지원\n\n자격요건\n- 문서 작성 능력(PPT/Excel)\n- 협업 툴 사용 경험',
    },
    {
      id: 900003, company: '포스타입', title: '프론트엔드 개발자', day: 11, status: ApplicationStatus.IN_PROGRESS, source: 'https://www.wanted.co.kr', location: '원격/서울',
      description: '주요업무\n- 사용자 웹 화면 개발 및 성능 개선\n- 디자인 시스템 컴포넌트 유지보수\n\n자격요건\n- React/TypeScript 경험\n- 웹 접근성/반응형 UI 이해',
    },
    {
      id: 900004, company: '리멤버앤컴퍼니', title: '데이터 분석 인턴', day: 14, status: ApplicationStatus.NOT_APPLIED, source: 'https://www.wanted.co.kr', location: '서울',
      description: '주요업무\n- 서비스 지표 대시보드 운영\n- 실험 결과 분석 및 인사이트 도출\n\n자격요건\n- SQL 활용 가능\n- 데이터 시각화 도구 사용 경험',
    },
    {
      id: 900005, company: '버즈빌', title: '서비스 기획 인턴', day: 18, status: ApplicationStatus.APPLIED, source: 'https://inthiswork.com', location: '성남',
      description: '주요업무\n- 신규 기능 요구사항 정의\n- 사용자 플로우/와이어프레임 작성\n\n자격요건\n- 문제 정의 및 커뮤니케이션 역량\n- 기획 문서 작성 경험',
    },
    {
      id: 900006, company: '직방', title: '사업관리 지원 인턴', day: 21, status: ApplicationStatus.IN_PROGRESS, source: 'https://www.wanted.co.kr', location: '과천',
      description: '주요업무\n- 사업 운영 데이터 정리\n- 프로젝트 리소스/일정 관리 지원\n\n자격요건\n- 꼼꼼한 문서 정리 능력\n- 유관 부서 협업 커뮤니케이션',
    },
    {
      id: 900007, company: '당근', title: '백오피스 운영 매니저', day: 23, status: ApplicationStatus.NOT_APPLIED, source: 'https://inthiswork.com', location: '서울',
      description: '주요업무\n- 운영 프로세스 점검 및 개선\n- 고객/파트너 문의 처리 지원\n\n자격요건\n- 운영 업무 경험 또는 높은 관심\n- 책임감 있는 업무 수행 태도',
    },
    {
      id: 900008, company: '토스', title: 'AI 리서치 엔지니어', day: 24, status: ApplicationStatus.REJECTED, source: 'https://www.wanted.co.kr', location: '원격',
      description: '주요업무\n- LLM 기반 기능 PoC 개발\n- 모델 평가 및 프롬프트 최적화\n\n자격요건\n- Python 개발 경험\n- 머신러닝/자연어처리 기본 이해',
    },
    {
      id: 900009, company: '컬리', title: 'QA 엔지니어 인턴', day: 25, status: ApplicationStatus.APPLIED, source: 'https://inthiswork.com', location: '서울',
      description: '주요업무\n- 테스트 케이스 설계 및 실행\n- 이슈 리포트 작성 및 회귀 테스트\n\n자격요건\n- 소프트웨어 테스트 기본 이해\n- 버그 트래킹 툴 사용 경험',
    },
    {
      id: 900010, company: '무신사', title: '클라우드 운영 엔지니어', day: 26, status: ApplicationStatus.ACCEPTED, source: 'https://www.wanted.co.kr', location: '판교',
      description: '주요업무\n- AWS 인프라 모니터링/운영\n- 배포 자동화 파이프라인 관리\n\n자격요건\n- Linux/네트워크 기본 지식\n- 클라우드 서비스 운영 경험',
    },
  ];

  return samples.map((sample) => ({
    id: sample.id,
    user_id: 0,
    job_posting_id: sample.id,
    status: sample.status,
    memo: null,
    created_at: nowIso,
    updated_at: null,
    job_posting: {
      id: sample.id,
      company_name: sample.company,
      job_title: sample.title,
      deadline: febDate(sample.day),
      original_url: sample.source,
      parsed_data: null,
      description: sample.description,
      description_raw: null,
      location: sample.location,
      created_at: nowIso,
      updated_at: null,
    },
  }));
};

const toDateKey = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateLabel = (dateKey: string | null): string => {
  if (!dateKey) return '';
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

export default function Home() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<AddMode>('parse');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'deadlineAsc' | 'deadlineDesc' | 'companyAsc'>(
    'deadlineAsc'
  );
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const showToast = (type: ToastType, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((prev) => [...prev, { id, type, message }]);
    const duration = type === 'error' ? 500 : 1200;
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
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
        setApplications(createMockApplications());
      } else if (axios.isCancel(error)) {
        setIsAuthenticated(false);
        setApplications(createMockApplications());
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSelectedCalendarDate(null);
    }
  }, [isMobile]);

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
      return;
    }
    showToast('error', '로그인 후 이용할 수 있습니다.');
    router.push('/login');
  };

  const requireAuthToastOnly = (action: () => void) => {
    if (isAuthenticated) {
      action();
      return;
    }
    showToast('error', '로그인 후 이용할 수 있습니다.');
  };

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

  const selectedDateApplications = useMemo(() => {
    if (!selectedCalendarDate) return [];

    return applications
      .filter((app) => toDateKey(app.job_posting.deadline) === selectedCalendarDate)
      .sort((a, b) => a.job_posting.company_name.localeCompare(b.job_posting.company_name, 'ko'));
  }, [applications, selectedCalendarDate]);

  const selectedCalendarDateLabel = useMemo(
    () => toDateLabel(selectedCalendarDate),
    [selectedCalendarDate]
  );

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

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-0">
        <div className="mb-1 flex items-center justify-between gap-2 sm:mb-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/jobcal-logo.png"
              alt="JobCal logo"
              width={112}
              height={112}
              className="h-16 w-16 rounded-xl object-contain sm:h-24 sm:w-24 md:h-[112px] md:w-[112px]"
              priority
            />
            <div className="flex h-16 flex-col justify-center leading-none sm:h-24 md:h-[112px]">
              <h1 className="text-2xl font-black tracking-tight text-[#132033] sm:text-3xl md:text-4xl">JobCal</h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#58677c] sm:mt-1.5 sm:text-xs md:text-sm">
                Never Miss a Deadline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => requireAuthToastOnly(() => setIsFeedbackModalOpen(true))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#cfd8e3] bg-white/85 text-[#435067] transition-colors hover:border-[#136fbd] hover:text-[#0e5a99] sm:h-11 sm:w-11"
              aria-label="피드백 보내기"
              title="피드백 보내기"
            >
              <MessageSquareMore size={18} />
            </button>
            {isAuthenticated ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#cfd8e3] bg-white/85 text-[#435067] transition-colors hover:border-[#136fbd] hover:text-[#0e5a99] sm:h-11 sm:w-11"
                  aria-label="프로필 메뉴"
                >
                  <User size={18} />
                </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-[#cfd8e3] bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      showToast('success', '마이페이지는 준비 중입니다.');
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-[#eef5fc]"
                  >
                    마이페이지
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProfileMenuOpen(false);
                      setIsAuthenticated(false);
                      setApplications(createMockApplications());
                      await authApi.logout();
                      window.location.assign('/');
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    로그아웃
                  </button>
                </div>
              )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#cfd8e3] bg-white/90 px-4 text-sm font-semibold text-[#435067] transition-colors hover:border-[#136fbd] hover:text-[#0e5a99] sm:h-11"
                aria-label="로그인"
              >
                <LogIn size={16} />
                로그인
              </button>
            )}
          </div>
        </div>

        <div className="surface-card px-3 pb-2 pt-2 sm:px-5 sm:pb-5 sm:pt-4 md:px-6 md:pb-6">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-5">
            <div className="inline-flex rounded-2xl border border-[#cfd8e3] bg-white/90 p-1">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-label="달력 모드"
                className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
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
                className={`flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
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

          {isAuthenticated === false && (
            <div className="mb-3 rounded-2xl border border-[#cfe1f5] bg-[#eef6ff] px-3 py-2 text-xs font-semibold text-[#335679] sm:text-sm">
              로그인 전 체험 데이터가 표시 중입니다. 로그인하면 내 공고 데이터로 전환됩니다.
            </div>
          )}

          <div className={viewMode === 'calendar' ? 'block' : 'hidden'} aria-hidden={viewMode !== 'calendar'}>
            <JobCalendar
              applications={applications}
              onSelectEvent={handleSelectEvent}
              onSelectDate={(date) => setSelectedCalendarDate(toDateKey(date))}
              disableInteraction={isMobile}
            />
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
            {filteredApplications.length === 0 ? (
              <div className="rounded-2xl border border-[#dbe6f2] bg-white px-4 py-8 text-center text-sm text-slate-500">
                {applications.length === 0
                  ? '등록된 채용 공고가 없습니다.'
                  : '현재 필터 조건에 맞는 공고가 없습니다.'}
              </div>
            ) : (
              <>
                <div className="space-y-2 md:hidden">
                  {filteredApplications.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className="w-full rounded-2xl border border-[#dbe6f2] bg-white p-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f8fbff]"
                      onClick={() => handleSelectEvent(app)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{app.job_posting.company_name}</p>
                          <p className="mt-1 truncate text-sm text-slate-600">{app.job_posting.job_title}</p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold"
                          style={{
                            backgroundColor: ApplicationStatusStyles[app.status].bg,
                            color: ApplicationStatusStyles[app.status].text,
                            border: `1px solid ${ApplicationStatusStyles[app.status].border}`,
                          }}
                        >
                          {ApplicationStatusLabels[app.status]}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        마감일:{' '}
                        {app.job_posting.deadline
                          ? new Date(app.job_posting.deadline).toLocaleDateString('ko-KR')
                          : '-'}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="hidden overflow-hidden rounded-2xl border border-[#dbe6f2] md:block">
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
                    {filteredApplications.map((app) => (
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
                    ))}
                  </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedCalendarDate && viewMode === 'calendar' && (
        <div className="fixed inset-0 z-[65] md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
            onClick={() => setSelectedCalendarDate(null)}
            aria-label="날짜 공고 리스트 닫기"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-hidden rounded-t-3xl border border-[#d7e2ef] bg-white shadow-[0_-14px_40px_rgba(15,23,42,0.2)]">
            <div className="px-4 pb-3 pt-3">
              <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-slate-300" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#132033]">{selectedCalendarDateLabel}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate(null)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  닫기
                </button>
              </div>
            </div>
            <div className="max-h-[calc(70vh-58px)] overflow-y-auto px-4 pb-5">
              {selectedDateApplications.length === 0 ? (
                <p className="rounded-2xl border border-[#e1e9f4] bg-[#f8fbff] px-4 py-5 text-center text-sm text-slate-500">
                  이 날짜에 마감 공고가 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateApplications.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className="w-full rounded-2xl border border-[#dbe6f2] bg-white px-3 py-3 text-left shadow-[0_3px_10px_rgba(15,23,42,0.04)]"
                      onClick={() => {
                        setSelectedCalendarDate(null);
                        handleSelectEvent(app);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{app.job_posting.company_name}</p>
                          <p className="mt-1 truncate text-xs text-slate-600">{app.job_posting.job_title}</p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold"
                          style={{
                            backgroundColor: ApplicationStatusStyles[app.status].bg,
                            color: ApplicationStatusStyles[app.status].text,
                            border: `1px solid ${ApplicationStatusStyles[app.status].border}`,
                          }}
                        >
                          {ApplicationStatusLabels[app.status]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        readOnly={!isAuthenticated}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        isSubmitting={isFeedbackSubmitting}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={async (payload) => {
          if (!isAuthenticated) {
            showToast('error', '로그인 후 이용할 수 있습니다.');
            router.push('/login');
            return;
          }
          try {
            setIsFeedbackSubmitting(true);
            await feedbackApi.create({
              category: payload.category,
              message: payload.message,
              pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
            });
            setIsFeedbackModalOpen(false);
            showToast('success', '피드백이 전송되었습니다. 감사합니다.');
          } catch (error) {
            console.error('Failed to send feedback:', error);
            showToast('error', '피드백 전송에 실패했습니다.');
          } finally {
            setIsFeedbackSubmitting(false);
          }
        }}
      />

      <div className="fixed left-3 right-3 top-3 z-[70] space-y-2 sm:left-auto sm:right-4 sm:top-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur sm:min-w-[240px] sm:max-w-[360px] ${
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
