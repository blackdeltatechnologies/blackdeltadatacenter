import { useState, useRef } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FileUploadProps {
  onUploadComplete: () => void;
}

export const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const uploadFiles = async () => {
    if (!user || selectedFiles.length === 0) return;

    setUploading(true);
    const newProgress: Record<string, number> = {};

    for (const file of selectedFiles) {
      try {
        newProgress[file.name] = 0;
        setUploadProgress({ ...newProgress });

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('user_files').insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
        });

        if (dbError) throw dbError;

        newProgress[file.name] = 100;
        setUploadProgress({ ...newProgress });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress({});
    onUploadComplete();
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Upload Files</h2>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-300 mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Support for any file type
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Select Files
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-slate-300">
            Selected Files ({selectedFiles.length})
          </h3>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-slate-700 rounded-lg p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{file.name}</p>
                  <p className="text-slate-400 text-xs">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {uploading && uploadProgress[file.name] !== undefined ? (
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Files'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
