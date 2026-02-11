'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import JobCalendar from '@/components/calendar/JobCalendar';
import JobAddModal from '@/components/job/JobAddModal';
import JobDetailPanel from '@/components/job/JobDetailPanel';
import { applicationsApi, authApi } from '@/lib/api';
import { removeAuthToken } from '@/lib/auth';
import {
  Application,
  ApplicationStatusLabels,
  ApplicationStatusStyles,
} from '@/types/application';

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

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
      try {
        await authApi.fetchAccessToken();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }
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
        <div className="w-full max-w-lg bg-white/90 backdrop-blur rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] p-8 border border-[#e5edff]">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">로그인이 필요합니다</h1>
          <p className="text-slate-600 mt-2">
            잡칼을 사용하려면 코그니토 로그인이 필요합니다. 아래 버튼을 눌러 로그인해 주세요.
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
              onClick={() => fetchApplications({ showLoading: true })}
              className="w-full border border-slate-200 text-slate-700 px-5 py-3 rounded-full font-semibold hover:bg-slate-50 transition-colors"
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
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">JobCal</h1>
            <p className="text-slate-600 mt-1">채용 일정 관리</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await authApi.logout();
                removeAuthToken();
                setIsAuthenticated(false);
              }}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              로그아웃
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-full hover:bg-primary-500 transition-colors shadow-[0_10px_24px_rgba(37,99,235,0.25)]"
            >
              <Plus size={20} />
              공고 추가
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_14px_36px_rgba(15,23,42,0.08)] p-6 border border-[#e5edff]">
          <JobCalendar applications={applications} onSelectEvent={handleSelectEvent} />
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900">전체 지원 현황</h2>
          <div className="bg-white rounded-3xl shadow-[0_14px_36px_rgba(15,23,42,0.08)] overflow-hidden border border-[#e5edff]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f3f6ff]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      회사명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      직무
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      마감일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#edf2ff]">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                        등록된 채용 공고가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-[#f6f9ff] cursor-pointer transition-colors"
                        onClick={() => handleSelectEvent(app)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {app.job_posting.company_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {app.job_posting.job_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {app.job_posting.deadline
                            ? new Date(app.job_posting.deadline).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="px-2 py-1 text-xs font-bold rounded-full"
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

      <JobAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchApplications({ showLoading: true })}
      />

      <JobDetailPanel
        application={selectedApplication}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        onUpdate={() => fetchApplications({ showLoading: false })}
      />
    </main>
  );
}
