'use client';

import { Application, ApplicationStatus, ApplicationStatusLabels, ApplicationStatusStyles } from '@/types/application';
import { applicationsApi } from '@/lib/api';
import { useEffect, useState } from 'react';
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
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(ApplicationStatus.NOT_APPLIED);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const appId = application?.id ?? null;
  const appStatus = application?.status ?? null;

  useEffect(() => {
    if (!application) return;
    setCurrentStatus(application.status);
  }, [appId, appStatus]);

  if (!isOpen || !application) return null;

  const handleStatusChange = async (status: ApplicationStatus) => {
    const previousStatus = currentStatus;
    setIsUpdating(true);
    setCurrentStatus(status);
    try {
      console.log('Status change requested:', status);
      const updated = await applicationsApi.updateStatus(application.id, { status });
      console.log('Status change applied:', updated.status);
      setCurrentStatus(updated.status);
      setIsStatusOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      setCurrentStatus(previousStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] z-40 transform transition-transform duration-300 ease-in-out border-l border-[#e5edff]">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b bg-[#f3f6ff]">
          <h2 className="text-xl font-extrabold text-slate-900">채용 상세</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={20} className="text-slate-500" />
              <h3 className="text-lg font-bold text-slate-900">{application.job_posting.company_name}</h3>
            </div>
            <p className="text-slate-600">{application.job_posting.job_title}</p>
          </div>

          {application.job_posting.deadline && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={18} />
              <span>마감일: {new Date(application.job_posting.deadline).toLocaleDateString('ko-KR')}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              지원 상태
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsStatusOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2 rounded-xl border-2"
                style={{
                  backgroundColor: ApplicationStatusStyles[currentStatus].bg,
                  borderColor: ApplicationStatusStyles[currentStatus].border,
                  color: ApplicationStatusStyles[currentStatus].text,
                }}
              >
                <span className="font-semibold">{ApplicationStatusLabels[currentStatus]}</span>
                <span className="text-xs">{isStatusOpen ? '닫기' : '변경'}</span>
              </button>

              {isStatusOpen && (
                <div className="space-y-2">
                  {Object.values(ApplicationStatus).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdating}
                      className="w-full text-left px-4 py-2 rounded-xl border-2 transition-colors"
                      style={
                        currentStatus === status
                          ? {
                              backgroundColor: ApplicationStatusStyles[status].bg,
                              borderColor: ApplicationStatusStyles[status].border,
                              color: ApplicationStatusStyles[status].text,
                            }
                          : {
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              color: '#0f172a',
                            }
                      }
                    >
                      {ApplicationStatusLabels[status]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {application.job_posting.location && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                근무지역
              </label>
              <p className="text-slate-600">{application.job_posting.location}</p>
            </div>
          )}

          {application.job_posting.description && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                설명
              </label>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">
                {application.job_posting.description}
              </p>
            </div>
          )}

          {application.memo && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                메모
              </label>
              <p className="text-slate-600 text-sm">{application.memo}</p>
            </div>
          )}

          <div>
            <a
              href={application.job_posting.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-900 hover:text-primary-600 underline decoration-primary-400"
            >
              <ExternalLink size={16} />
              원본 공고 보기
            </a>
          </div>
        </div>

        <div className="p-6 border-t bg-[#f7f9ff]">
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
            className="w-full px-4 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
