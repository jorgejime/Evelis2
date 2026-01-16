import React from 'react';
import { Upload, FileSpreadsheet, Trash2, Calendar, Database } from 'lucide-react';
import { useStore } from '../store';
import { FileType, StoredFile } from '../types';

const UploadZone = ({ 
  title, 
  subtitle, 
  onUpload,
  colorClass
}: { 
  title: string; 
  subtitle: string; 
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  colorClass: string;
}) => {
  return (
    <div className={`relative group flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all duration-300 ${colorClass} hover:shadow-md`}>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={(e) => {
            onUpload(e);
            e.target.value = ''; // Reset to allow re-upload same file name
        }} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
      <h3 className="font-semibold text-slate-700 text-sm text-center">{title}</h3>
      <p className="text-xs text-slate-500 text-center">{subtitle}</p>
    </div>
  );
};

const FileList = ({ files, onDelete }: { files: StoredFile[], onDelete: (id: string) => void }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-6 space-y-2">
      <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
        <Database className="w-4 h-4" />
        Archivos en Base de Datos
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {files.map(file => (
          <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-10 rounded-full ${
                    file.type === 'history2025' ? 'bg-blue-500' : 
                    file.type === 'report2026' ? 'bg-green-500' : 'bg-orange-500'
                }`}></div>
                <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{file.name}</p>
                    <div className="flex gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(file.uploadDate).toLocaleDateString()}
                        </span>
                        <span>{file.rowCount.toLocaleString()} filas</span>
                        <span className="bg-slate-100 px-2 rounded text-slate-600 uppercase text-[10px] tracking-wide font-bold py-0.5">
                            {file.type === 'history2025' ? 'Histórico 25' : file.type === 'report2026' ? 'Reporte 26' : 'Maestro SKU'}
                        </span>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => onDelete(file.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Borrar archivo"
            >
                <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FileUpload = () => {
  const { uploadFile, storedFiles, deleteFile, isLoading } = useStore();

  const handleUpload = (type: FileType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0], type);
    }
  };

  const hasSkuMaster = storedFiles.some(f => f.type === 'skuMaster');
  const hasReport2026 = storedFiles.some(f => f.type === 'report2026');

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-lg font-bold text-slate-800">Centro de Control de Datos</h2>
            <p className="text-slate-500 text-sm">Gestiona los archivos fuente. Los datos se consolidan automáticamente.</p>
        </div>
        {isLoading && <span className="text-xs font-bold text-blue-600 animate-pulse bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Procesando...</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UploadZone 
          title="Agregar Histórico 2025" 
          subtitle="Formato Simple (.xlsx)"
          onUpload={handleUpload('history2025')}
          colorClass="border-blue-200 bg-blue-50 hover:border-blue-400"
        />
        <UploadZone 
          title="Agregar Reporte 2026" 
          subtitle="Reporte Sodimac (.xlsx)"
          onUpload={handleUpload('report2026')}
          colorClass="border-green-200 bg-green-50 hover:border-green-400"
        />
        <UploadZone 
          title="Actualizar Maestro SKUs" 
          subtitle="Catálogo de Productos"
          onUpload={handleUpload('skuMaster')}
          colorClass="border-orange-200 bg-orange-50 hover:border-orange-400"
        />
      </div>

      {!hasSkuMaster && hasReport2026 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2">
            ⚠️ Tienes reportes de 2026 pero falta el Maestro de SKUs. Súbelo para clasificar los productos.
        </div>
      )}

      <FileList files={storedFiles} onDelete={deleteFile} />
    </div>
  );
};
