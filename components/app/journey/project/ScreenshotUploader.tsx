import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

export interface LocalScreenshot {
  file: File;
  preview: string;
}

interface ScreenshotUploaderProps {
  label: string;
  helperText: string;
  existingPaths: string[];
  existingUrls: Record<string, string>;
  localFiles: LocalScreenshot[];
  onAddFiles: (files: LocalScreenshot[]) => void;
  onRemoveLocal: (index: number) => void;
  onRemoveExisting: (path: string) => void;
  maxFiles: number;
  minFiles?: number;
  accentColor: string;
  accentDark: string;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  label,
  helperText,
  existingPaths,
  existingUrls,
  localFiles,
  onAddFiles,
  onRemoveLocal,
  onRemoveExisting,
  maxFiles,
  minFiles = 0,
  accentColor,
  accentDark,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const totalCount = existingPaths.length + localFiles.length;
  const canAdd = totalCount < maxFiles;

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const valid: LocalScreenshot[] = [];
    const remaining = maxFiles - totalCount;

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const f = files[i];
      if (!ALLOWED_TYPES.includes(f.type)) continue;
      if (f.size > MAX_SIZE) continue;
      valid.push({ file: f, preview: URL.createObjectURL(f) });
    }
    if (valid.length > 0) onAddFiles(valid);
  }, [maxFiles, totalCount, onAddFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || !canAdd) return;
    processFiles(e.dataTransfer.files);
  }, [disabled, canAdd, processFiles]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (disabled || !canAdd) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) processFiles(files);
  }, [disabled, canAdd, processFiles]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A202C', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 10 }}>
        {helperText}
      </div>

      {/* Thumbnails */}
      {(existingPaths.length > 0 || localFiles.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {existingPaths.map((path) => (
            <div key={path} style={{ position: 'relative' }}>
              <img
                src={existingUrls[path] || ''}
                alt="Screenshot"
                style={{
                  width: 80, height: 80, borderRadius: 8, objectFit: 'cover',
                  border: '1px solid #E2E8F0',
                }}
              />
              {!disabled && (
                <button
                  onClick={() => onRemoveExisting(path)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#1A202C', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <X size={10} color="#FFFFFF" />
                </button>
              )}
            </div>
          ))}
          {localFiles.map((ls, idx) => (
            <div key={idx} style={{ position: 'relative', animation: 'fadeIn 0.2s ease' }}>
              <img
                src={ls.preview}
                alt="Screenshot"
                style={{
                  width: 80, height: 80, borderRadius: 8, objectFit: 'cover',
                  border: '1px solid #E2E8F0',
                }}
              />
              {!disabled && (
                <button
                  onClick={() => onRemoveLocal(idx)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#1A202C', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <X size={10} color="#FFFFFF" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canAdd && !disabled && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? accentColor : '#E2E8F0'}`,
            borderRadius: 12,
            padding: '16px 20px',
            textAlign: 'center' as const,
            cursor: 'pointer',
            background: dragOver ? `${accentColor}08` : '#F7FAFC',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <Upload size={20} color="#A0AEC0" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 13, color: '#718096' }}>
            Drop screenshots here or click to upload
          </div>
          <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
            PNG, JPG, WEBP · Max 5MB · {totalCount}/{maxFiles} uploaded
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {minFiles > 0 && totalCount < minFiles && !disabled && (
        <div style={{ fontSize: 11, color: '#E53E3E', marginTop: 4 }}>
          At least {minFiles} screenshot{minFiles > 1 ? 's' : ''} required
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
};
