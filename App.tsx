import React, { useEffect } from 'react';
import { LayoutDashboard, Database } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { useStore } from './store';

function App() {
  const { loadInitialData, isLoading } = useStore();

  useEffect(() => {
    loadInitialData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              Sales<span className="text-blue-600">Intel</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
              <Database className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-600">DB Local Activa</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Dashboard de Ventas</h2>
          <p className="text-slate-500 mt-1">
            Sistema de análisis consolidado (2025 + 2026). Los datos se guardan automáticamente.
          </p>
        </div>

        {/* Ingestion Module */}
        <FileUpload />

        {/* Dashboard Visualization */}
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
