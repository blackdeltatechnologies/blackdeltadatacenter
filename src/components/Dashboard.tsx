import { useState } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BLACK DELTA</h1>
                <p className="text-xs text-slate-400">DATA CENTER</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Logged in as</p>
                <p className="text-sm text-white font-medium">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Secure Storage
            </h3>
            <p className="text-slate-400 text-sm">
              Your files are encrypted and securely stored in our data center with enterprise-grade security.
            </p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Access Anywhere
            </h3>
            <p className="text-slate-400 text-sm">
              Upload, download, and manage your files from any device with internet access.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <FileUpload onUploadComplete={handleUploadComplete} />
          <FileList refreshTrigger={refreshTrigger} />
        </div>
      </main>

      <footer className="mt-12 pb-8 text-center text-slate-500 text-sm">
        <p>&copy; 2024 BLACK DELTA DATA CENTER. All rights reserved.</p>
      </footer>
    </div>
  );
};
