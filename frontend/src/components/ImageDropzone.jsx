import { useCallback, useEffect, useRef, useState } from 'react';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

export default function ImageDropzone({
  file,
  onFileChange,
  onPreviewClear,
  previewUrl,
  disabled = false,
  label = 'Ảnh CCCD',
  hint = 'Kéo thả hoặc bấm để chọn · JPG, PNG, WEBP · tối đa 5MB',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [blobPreview, setBlobPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setBlobPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setBlobPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const validate = useCallback((f) => {
    if (!ACCEPT.includes(f.type)) {
      return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.';
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `Ảnh không được lớn hơn ${MAX_MB}MB.`;
    }
    return null;
  }, []);

  const pickFile = useCallback((f) => {
    if (!f) return;
    const err = validate(f);
    if (err) {
      onFileChange(null, err);
      return;
    }
    onFileChange(f, null);
  }, [onFileChange, validate]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    pickFile(f);
  };

  const showPreview = blobPreview || previewUrl;

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`
          relative rounded-[var(--radius-sm)] border-2 border-dashed transition-all cursor-pointer
          ${dragOver ? 'border-[var(--primary-500)] bg-[var(--accent-bg)] scale-[1.01]' : 'border-[var(--border)] bg-[var(--surface)]'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[var(--primary-400)] hover:bg-[var(--accent-bg)]/50'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          className="hidden"
          disabled={disabled}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />

        {showPreview ? (
          <div className="p-3 flex flex-col items-center gap-2">
            <img
              src={showPreview}
              alt="Xem trước ảnh CCCD"
              className="max-h-40 rounded-[var(--radius-sm)] object-contain border border-[var(--border-light)]"
            />
            <p className="text-xs text-[var(--text-muted)] m-0">
              {file ? file.name : 'Ảnh hiện tại · chọn ảnh mới để thay'}
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (file) {
                    onFileChange(null, null);
                    if (inputRef.current) inputRef.current.value = '';
                  } else {
                    onPreviewClear?.();
                  }
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Gỡ ảnh đã chọn
              </button>
            )}
          </div>
        ) : (
          <div className="py-8 px-4 text-center">
            <svg className="w-10 h-10 mx-auto text-[var(--primary-400)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-[var(--text-h)] font-medium m-0">Kéo thả ảnh vào đây</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 m-0">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
