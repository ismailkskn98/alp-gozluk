'use client';

import { FileImage, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

const ACCEPTED_IMAGES = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'image/avif': ['.avif'] };

export default function AdminDropzone({ maxFiles = 5, maxSize = 10 * 1024 * 1024, onChange, className }) {
  const [files, setFiles] = useState([]);
  const filesRef = useRef(files);
  const [error, setError] = useState('');
  const dropzone = useDropzone({
    accept: ACCEPTED_IMAGES,
    maxFiles,
    maxSize,
    onDropAccepted(accepted) {
      setError('');
      setFiles((current) => {
        const next = [...current, ...accepted].slice(0, maxFiles).map((file) => ({ file, preview: URL.createObjectURL(file) }));
        onChange?.(next.map((entry) => entry.file));
        return next;
      });
    },
    onDropRejected(rejections) {
      const code = rejections[0]?.errors?.[0]?.code;
      setError(code === 'file-too-large' ? 'Her dosya en fazla 10 MB olabilir.' : `Yalnız JPEG, PNG, WebP veya AVIF; en fazla ${maxFiles} dosya.`);
    },
  });

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => filesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview)), []);

  function remove(preview) {
    setFiles((current) => {
      const target = current.find((entry) => entry.preview === preview);
      if (target) URL.revokeObjectURL(target.preview);
      const next = current.filter((entry) => entry.preview !== preview);
      onChange?.(next.map((entry) => entry.file));
      return next;
    });
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div {...dropzone.getRootProps()} className={cn('group grid min-h-44 place-items-center rounded-xl border border-dashed border-border-strong bg-surface-subtle p-5 text-center outline-none transition hover:border-primary hover:bg-accent-soft/35 focus-visible:ring-2 focus-visible:ring-ring/30', dropzone.isDragActive && 'border-primary bg-accent-soft/55')}>
        <input {...dropzone.getInputProps()} />
        <div>
          <span className="mx-auto grid size-10 place-items-center rounded-xl border border-border bg-card text-primary shadow-sm"><UploadCloud className="size-5" /></span>
          <p className="mt-3 text-sm font-medium">Görselleri buraya bırakın veya seçin</p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, AVIF · en fazla {maxFiles} dosya · dosya başına 10 MB</p>
        </div>
      </div>
      {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
      {files.length ? <ul className="grid gap-2 sm:grid-cols-2">{files.map(({ file, preview }) => <li key={preview} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"><Image src={preview} width={48} height={48} alt="Yükleme önizlemesi" unoptimized className="size-12 rounded-md object-cover" /><FileImage className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><button type="button" onClick={() => remove(preview)} aria-label={`${file.name} dosyasını kaldır`} className="grid size-8 place-items-center rounded-lg hover:bg-muted"><X className="size-4" /></button></li>)}</ul> : null}
    </div>
  );
}
