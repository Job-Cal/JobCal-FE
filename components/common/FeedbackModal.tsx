'use client';

import { useEffect, useRef, useState } from 'react';
import { X, MessageSquareWarning } from 'lucide-react';

type FeedbackCategory = 'BUG' | 'FEATURE' | 'UX' | 'OTHER';

interface FeedbackModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { category: FeedbackCategory; message: string }) => Promise<void>;
}

const categoryOptions: Array<{ value: FeedbackCategory; label: string }> = [
  { value: 'BUG', label: '버그 제보' },
  { value: 'FEATURE', label: '기능 요청' },
  { value: 'UX', label: 'UI/UX 의견' },
  { value: 'OTHER', label: '기타' },
];

export default function FeedbackModal({ isOpen, isSubmitting, onClose, onSubmit }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('BUG');
  const [message, setMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setCategory('BUG');
      setMessage('');
      setShowError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        aria-label="피드백 보내기"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[#cfd8e3] bg-white/95 shadow-[0_22px_60px_rgba(15,23,42,0.25)]"
      >
        <div className="flex items-center justify-between border-b border-[#0e5a99] bg-[#136fbd] p-6">
          <h2 className="text-xl font-extrabold text-white">피드백 보내기</h2>
          <button
            onClick={onClose}
            className="text-white/80 transition-colors hover:text-white"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 bg-[#edf4fb] p-6">
          <div className="rounded-2xl border border-[#d6e4f4] bg-white p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4d6682]">
              <MessageSquareWarning size={14} />
              서비스 개선을 위해 의견을 남겨주세요.
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">분류</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
              className="w-full rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2 text-sm text-slate-700 focus:border-[#136fbd] focus:outline-none focus:ring-2 focus:ring-[#9dcff9]"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">내용</label>
            <textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (event.target.value.trim()) setShowError(false);
              }}
              className={`min-h-[140px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ${
                showError ? 'border border-rose-500' : 'border border-[#cfd8e3]'
              }`}
              placeholder="불편한 점이나 개선 아이디어를 자유롭게 적어주세요."
            />
            {showError && (
              <p className="mt-1 text-sm text-rose-600">피드백 내용을 입력해주세요.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                const trimmed = message.trim();
                if (!trimmed) {
                  setShowError(true);
                  return;
                }
                await onSubmit({ category, message: trimmed });
              }}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#136fbd] px-4 py-2 text-white transition-colors hover:bg-[#0e5a99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? '전송 중...' : '보내기'}
            </button>
            <button
              onClick={onClose}
              className="rounded-2xl border border-[#cfd8e3] bg-white px-4 py-2 text-slate-700 hover:bg-[#f2f7fd]"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
