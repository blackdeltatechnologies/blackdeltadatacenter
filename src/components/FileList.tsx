import { useState, useEffect } from 'react';
import { Download, Trash2, File, HardDrive, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_at: string;
}

interface FileListProps {
  refreshTrigger: number;
}

export const FileList = ({ refreshTrigger }: FileListProps) => {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchFiles = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [user, refreshTrigger]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadFile = async (file: UserFile) => {
    setDownloadingId(file.id);

    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteFile = async (file: UserFile) => {
    if (!confirm(`Are you sure you want to delete "${file.file_name}"?`)) {
      return;
    }

    setDeletingId(file.id);

    try {
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('user_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-slate-400 mt-4">Loading files...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Your Files</h2>
        <div className="flex items-center gap-2 text-slate-400">
          <HardDrive className="w-5 h-5" />
          <span className="text-sm">
            {files.length} files • {formatFileSize(totalSize)}
          </span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">No files uploaded yet</p>
          <p className="text-sm text-slate-500">
            Upload your first file to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 rounded-lg p-4 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {file.file_name}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile(file)}
                  disabled={downloadingId === file.id || deletingId === file.id}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download"
                >
                  {downloadingId === file.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  disabled={deletingId === file.id || downloadingId === file.id}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  {deletingId === file.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
