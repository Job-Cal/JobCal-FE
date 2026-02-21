'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { JobPostingCreate } from '@/types/job';

interface JobAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

interface FormData {
  url: string;
}

const SUPPORTED_URL_ONLY_ERROR = '지원하지 않는 주소입니다. 원티드/인디스워크 URL만 지원합니다.';

const isSupportedJobUrl = (value: string): boolean => {
  try {
    const { hostname } = new URL(value);
    const normalizedHost = hostname.toLowerCase();
    return normalizedHost === 'wanted.co.kr'
      || normalizedHost.endsWith('.wanted.co.kr')
      || normalizedHost === 'inthiswork.com'
      || normalizedHost.endsWith('.inthiswork.com');
  } catch {
    return false;
  }
};

export default function JobAddModal({ isOpen, onClose, onSuccess, onNotify }: JobAddModalProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<JobPostingCreate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!modalRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const nodes = modalRef.current.querySelectorAll<HTMLElement>(
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

  if (!isOpen) return null;

  const handleParse = async (data: FormData) => {
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    if (!isSupportedJobUrl(data.url)) {
      setParseError(SUPPORTED_URL_ONLY_ERROR);
      onNotify?.('error', SUPPORTED_URL_ONLY_ERROR);
      setIsParsing(false);
      return;
    }

    try {
      const result = await jobsApi.parse(data.url);
      
      if (result.success && result.data) {
        setParsedData(result.data);
      } else {
        const message = result.error || '파싱에 실패했습니다.';
        setParseError(message);
        onNotify?.('error', message);
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || '파싱 중 오류가 발생했습니다.';
      setParseError(message);
      onNotify?.('error', message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setIsSaving(true);
    try {
      // Debug: log data before sending
      console.log('📤 Sending job data:', parsedData);
      console.log('📅 Deadline:', parsedData.deadline, 'Type:', typeof parsedData.deadline);
      
      const result = await jobsApi.create(parsedData);
      console.log('✅ Job created successfully:', result);
      console.log('📅 Saved deadline:', result.deadline);
      
      reset();
      setParsedData(null);
      setParseError(null);
      onSuccess();
      onNotify?.('success', '채용 공고를 저장했습니다.');
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving job:', error);
      const message = error.response?.data?.detail || '저장 중 오류가 발생했습니다.';
      setParseError(message);
      onNotify?.('error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualInput = () => {
    // Allow manual input if parsing fails
    setParsedData({
      company_name: '',
      job_title: '',
      deadline: null,
      original_url: '',
      description: null,
      location: null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="채용 공고 추가"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#cfd8e3] bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-[#dbe6f2] bg-[#edf4fb] p-6">
          <h2 className="text-2xl font-extrabold text-[#132033]">채용 공고 추가</h2>
          <button
            onClick={onClose}
            className="text-slate-500 transition-colors hover:text-[#132033]"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {!parsedData ? (
            <form onSubmit={handleSubmit(handleParse)} className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-semibold text-slate-700 mb-2">
                  채용 공고 URL
                </label>
                <input
                  id="url"
                  type="url"
                  {...register('url', { required: 'URL을 입력해주세요.' })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2 focus:border-[#136fbd] focus:outline-none focus:ring-2 focus:ring-[#9dcff9]"
                  placeholder="https://www.wanted.co.kr/wd/..."
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              {parseError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm text-rose-600">{parseError}</p>
                  <button
                    type="button"
                    onClick={handleManualInput}
                    className="mt-2 text-sm text-rose-700 underline hover:text-rose-900"
                  >
                    수동으로 입력하기
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isParsing}
                  data-autofocus
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136fbd] px-4 py-2 text-white shadow-[0_10px_22px_rgba(19,111,189,0.25)] transition-colors hover:bg-[#0e5a99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      파싱 중...
                    </>
                  ) : (
                    '파싱하기'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-[#cfd8e3] px-4 py-2 hover:bg-[#f2f7fd]"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  회사명
                </label>
                <input
                  type="text"
                  value={parsedData.company_name}
                  onChange={(e) => setParsedData({ ...parsedData, company_name: e.target.value })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  직무명
                </label>
                <input
                  type="text"
                  value={parsedData.job_title}
                  onChange={(e) => setParsedData({ ...parsedData, job_title: e.target.value })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  마감일 *
                </label>
                <input
                  type="date"
                  value={parsedData.deadline || ''}
                  onChange={(e) => {
                    const newDeadline = e.target.value || null;
                    console.log('📅 Deadline changed:', newDeadline);
                    setParsedData({ ...parsedData, deadline: newDeadline });
                  }}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                  required
                />
                {!parsedData.deadline && (
                  <p className="mt-1 text-sm text-amber-600">
                    ⚠️ 마감일을 입력하지 않으면 캘린더에 표시되지 않습니다.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={parsedData.original_url}
                  onChange={(e) => setParsedData({ ...parsedData, original_url: e.target.value })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  위치
                </label>
                <input
                  type="text"
                  value={parsedData.location || ''}
                  onChange={(e) => setParsedData({ ...parsedData, location: e.target.value || null })}
                  className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2"
                  placeholder="예: 서울 강남구"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  공고 설명/요건
                </label>
                <textarea
                  value={parsedData.description || ''}
                  onChange={(e) => setParsedData({ ...parsedData, description: e.target.value || null })}
                  className="min-h-[140px] w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-3"
                  placeholder="파싱된 공고 설명/요건이 여기에 표시됩니다."
                />
              </div>

              {!parsedData.deadline && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-700">
                    ⚠️ 마감일이 없습니다. 캘린더에 표시하려면 마감일을 입력해주세요.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !parsedData.company_name || !parsedData.job_title}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136fbd] px-4 py-2 text-white shadow-[0_10px_22px_rgba(19,111,189,0.25)] transition-colors hover:bg-[#0e5a99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      저장 중...
                    </>
                  ) : (
                    '저장하기'
                  )}
                </button>
                <button
                  onClick={() => {
                    setParsedData(null);
                    setParseError(null);
                  }}
                  className="rounded-2xl border border-[#cfd8e3] px-4 py-2 hover:bg-[#f2f7fd]"
                >
                  다시 파싱
                </button>
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-[#cfd8e3] px-4 py-2 hover:bg-[#f2f7fd]"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
