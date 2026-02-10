'use client';

import { Application, ApplicationStatus, ApplicationStatusLabels } from '@/types/application';
import { applicationsApi } from '@/lib/api';
import { useState } from 'react';
import { X, ExternalLink, Calendar, Building2 } from 'lucide-react';

interface JobDetailPanelProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function JobDetailPanel({
  application,
  isOpen,
  onClose,
  onUpdate,
}: JobDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);

  if (!isOpen || !application) return null;

  const handleStatusChange = async (status: ApplicationStatus) => {
    setIsUpdating(true);
    try {
      await applicationsApi.updateStatus(application.id, { status });
      setSelectedStatus(status);
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = selectedStatus || application.status;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">채용 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={20} className="text-gray-400" />
              <h3 className="text-lg font-semibold">{application.job_posting.company_name}</h3>
            </div>
            <p className="text-gray-600">{application.job_posting.job_title}</p>
          </div>

          {application.job_posting.deadline && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={18} />
              <span>마감일: {new Date(application.job_posting.deadline).toLocaleDateString('ko-KR')}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              지원 상태
            </label>
            <div className="space-y-2">
              {Object.values(ApplicationStatus).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating}
                  className={`w-full text-left px-4 py-2 rounded-lg border-2 transition-colors ${
                    currentStatus === status
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ApplicationStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          {application.job_posting.location && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                근무지역
              </label>
              <p className="text-gray-600">{application.job_posting.location}</p>
            </div>
          )}

          {application.job_posting.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">
                {application.job_posting.description}
              </p>
            </div>
          )}

          {application.memo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <p className="text-gray-600 text-sm">{application.memo}</p>
            </div>
          )}

          <div>
            <a
              href={application.job_posting.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
            >
              <ExternalLink size={16} />
              원본 공고 보기
            </a>
          </div>
        </div>

        <div className="p-6 border-t">
          <button
            onClick={async () => {
              if (confirm('정말 삭제하시겠습니까?')) {
                try {
                  await applicationsApi.delete(application.id);
                  onUpdate();
                  onClose();
                } catch (error) {
                  console.error('Failed to delete:', error);
                }
              }
            }}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}

