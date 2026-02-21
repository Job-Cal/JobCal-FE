'use client';

import { Application, ApplicationStatus, ApplicationStatusLabels, ApplicationStatusStyles } from '@/types/application';
import { applicationsApi } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Calendar, Building2 } from 'lucide-react';

interface JobDetailPanelProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export default function JobDetailPanel({
  application,
  isOpen,
  onClose,
  onUpdate,
  onNotify,
}: JobDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(ApplicationStatus.NOT_APPLIED);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  const appId = application?.id ?? null;
  const appStatus = application?.status ?? null;

  useEffect(() => {
    if (!application) return;
    setCurrentStatus(application.status);
  }, [appId, appStatus]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusables?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panelRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

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
      onNotify?.('success', `지원 상태를 "${ApplicationStatusLabels[updated.status]}"로 변경했습니다.`);
    } catch (error) {
      console.error('Failed to update status:', error);
      setCurrentStatus(previousStatus);
      onNotify?.('error', '지원 상태 변경에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="채용 상세 패널"
        onClick={(event) => event.stopPropagation()}
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] w-full flex-col rounded-t-3xl border border-[#cfd8e3] bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.18)] md:top-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-96 md:rounded-none md:rounded-l-3xl"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
        <div className="flex items-center justify-between border-b border-[#dbe6f2] bg-[#edf4fb] p-6">
          <h2 className="text-xl font-extrabold text-[#132033]">채용 상세</h2>
          <button
            data-autofocus
            onClick={onClose}
            className="text-slate-500 transition-colors hover:text-[#132033]"
            aria-label="닫기"
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
                className="w-full rounded-2xl border-2 px-4 py-2 flex items-center justify-between"
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
                      className="w-full rounded-2xl border-2 px-4 py-2 text-left transition-colors"
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
              className="flex items-center gap-2 text-slate-900 underline decoration-[#136fbd] hover:text-[#136fbd]"
            >
              <ExternalLink size={16} />
              원본 공고 보기
            </a>
          </div>
        </div>

        <div className="border-t border-[#dbe6f2] bg-[#f2f7fd] p-6">
          <button
            onClick={async () => {
              if (confirm('정말 삭제하시겠습니까?')) {
                try {
                  await applicationsApi.delete(application.id);
                  onUpdate();
                  onClose();
                  onNotify?.('success', '공고를 삭제했습니다.');
                } catch (error) {
                  console.error('Failed to delete:', error);
                  onNotify?.('error', '공고 삭제에 실패했습니다.');
                }
              }
            }}
            className="w-full rounded-2xl bg-rose-600 px-4 py-2 text-white transition-colors hover:bg-rose-700"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
