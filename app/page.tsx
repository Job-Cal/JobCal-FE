'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import JobCalendar from '@/components/calendar/JobCalendar';
import JobAddModal from '@/components/job/JobAddModal';
import JobDetailPanel from '@/components/job/JobDetailPanel';
import { applicationsApi } from '@/lib/api';
import {
  Application,
  ApplicationStatus,
  ApplicationStatusLabels,
  ApplicationStatusColors,
} from '@/types/application';

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // 예시용 더미 데이터: 실제 공고가 없을 때 캘린더에 표시
  const mockApplications: Application[] = [
    {
      id: 1,
      user_id: 1,
      job_posting_id: 1,
      status: ApplicationStatus.APPLIED,
      memo: '첫 번째 더미 공고 메모',
      created_at: new Date().toISOString(),
      updated_at: null,
      job_posting: {
        id: 1,
        company_name: '잡칼 컴퍼니',
        job_title: '프론트엔드 엔지니어',
        deadline: '2026-02-20',
        original_url: 'https://example.com/jobs/1',
        parsed_data: null,
        description: 'React, TypeScript 기반 프론트엔드 개발',
        location: '서울',
        created_at: new Date().toISOString(),
        updated_at: null,
      },
    },
    // 같은 날짜(2026-02-20)에 또 다른 공고 예시
    {
      id: 4,
      user_id: 1,
      job_posting_id: 4,
      status: ApplicationStatus.IN_PROGRESS,
      memo: '동일 마감일 테스트용 공고',
      created_at: new Date().toISOString(),
      updated_at: null,
      job_posting: {
        id: 4,
        company_name: '잡칼 컴퍼니 B',
        job_title: '백엔드 엔지니어',
        deadline: '2026-02-20', // 위 공고와 같은 날짜
        original_url: 'https://example.com/jobs/4',
        parsed_data: null,
        description: '동일 마감일 공고가 여러 개일 때 캘린더 표시 확인용',
        location: '서울',
        created_at: new Date().toISOString(),
        updated_at: null,
      },
    },
    {
      id: 2,
      user_id: 1,
      job_posting_id: 2,
      status: ApplicationStatus.IN_PROGRESS,
      memo: '동일 날짜 다른 회사 공고 1',
      created_at: new Date().toISOString(),
      updated_at: null,
      job_posting: {
        id: 2,
        company_name: '네오잡스',
        job_title: '풀스택 개발자 (Node.js)',
        deadline: '2026-02-20',
        original_url: 'https://example.com/jobs/2',
        parsed_data: null,
        description: '동일 마감일 공고 예시 3',
        location: '리모트',
        created_at: new Date().toISOString(),
        updated_at: null,
      },
    },
    {
      id: 3,
      user_id: 1,
      job_posting_id: 3,
      status: ApplicationStatus.NOT_APPLIED,
      memo: '동일 날짜 다른 회사 공고 2',
      created_at: new Date().toISOString(),
      updated_at: null,
      job_posting: {
        id: 3,
        company_name: '스타트업 XYZ',
        job_title: '주니어 프론트엔드 개발자',
        deadline: '2026-02-20',
        original_url: 'https://example.com/jobs/3',
        parsed_data: null,
        description: '동일 마감일 공고 예시 4',
        location: '판교',
        created_at: new Date().toISOString(),
        updated_at: null,
      },
    },
  ];

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const data = await applicationsApi.getAll();
      console.log('Fetched applications:', data);
      console.log('Applications with deadlines:', data.filter(app => app.job_posting.deadline));
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
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
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">JobCal</h1>
            <p className="text-gray-600 mt-1">채용 일정 관리</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            공고 추가
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <JobCalendar
            // 실제 데이터가 없을 때는 예시 데이터로 캘린더 UI를 미리 확인할 수 있게 함
            applications={applications.length > 0 ? applications : mockApplications}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">전체 지원 현황</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      회사명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직무
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      마감일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        등록된 채용 공고가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectEvent(app)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.job_posting.company_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.job_posting.job_title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.job_posting.deadline
                            ? new Date(app.job_posting.deadline).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="px-2 py-1 text-xs font-semibold rounded-full"
                            style={{
                              backgroundColor: `${ApplicationStatusColors[app.status]}20`,
                              color: ApplicationStatusColors[app.status],
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
        onSuccess={fetchApplications}
      />

      <JobDetailPanel
        application={selectedApplication}
        isOpen={isDetailPanelOpen}
        onClose={handleCloseDetailPanel}
        onUpdate={fetchApplications}
      />
    </main>
  );
}

