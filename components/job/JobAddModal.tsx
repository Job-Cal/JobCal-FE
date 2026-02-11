'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { jobsApi, applicationsApi } from '@/lib/api';
import { JobPostingCreate } from '@/types/job';

interface JobAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  url: string;
}

export default function JobAddModal({ isOpen, onClose, onSuccess }: JobAddModalProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<JobPostingCreate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  if (!isOpen) return null;

  const handleParse = async (data: FormData) => {
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    try {
      const result = await jobsApi.parse(data.url);
      
      if (result.success && result.data) {
        setParsedData(result.data);
      } else {
        setParseError(result.error || '파싱에 실패했습니다.');
      }
    } catch (error: any) {
      setParseError(error.response?.data?.detail || '파싱 중 오류가 발생했습니다.');
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
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving job:', error);
      setParseError(error.response?.data?.detail || '저장 중 오류가 발생했습니다.');
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
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[4px] flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-[0_22px_60px_rgba(15,23,42,0.25)] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#e5edff]">
        <div className="flex items-center justify-between p-6 border-b bg-[#f3f6ff]">
          <h2 className="text-2xl font-extrabold text-slate-900">채용 공고 추가</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  placeholder="https://www.wanted.co.kr/wd/..."
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-sm text-rose-600">{parseError}</p>
                  <button
                    type="button"
                    onClick={handleManualInput}
                    className="mt-2 text-sm text-rose-600 hover:text-rose-800 underline"
                  >
                    수동으로 입력하기
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isParsing}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_22px_rgba(37,99,235,0.25)]"
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
                  className="px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white"
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white min-h-[140px]"
                  placeholder="파싱된 공고 설명/요건이 여기에 표시됩니다."
                />
              </div>

              {!parsedData.deadline && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-700">
                    ⚠️ 마감일이 없습니다. 캘린더에 표시하려면 마감일을 입력해주세요.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !parsedData.company_name || !parsedData.job_title}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-full hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_22px_rgba(37,99,235,0.25)]"
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
                  className="px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50"
                >
                  다시 파싱
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 rounded-full hover:bg-slate-50"
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
