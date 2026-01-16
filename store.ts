import { create } from 'zustand';
import { SaleRecord, SkuMaster, FileType, StoredFile } from './types';
import { parseExcel, processHistory2025, processReport2026, processSkuMaster } from './utils/dataProcessor';
import { saveFileWithRecords, getAllData, deleteFile as dbDeleteFile } from './utils/db';

interface AppState {
  storedFiles: StoredFile[];
  unifiedData: SaleRecord[];
  isLoading: boolean;
  
  // Actions
  uploadFile: (file: File, type: FileType) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  loadInitialData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  storedFiles: [],
  unifiedData: [],
  isLoading: true,

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const { files, records, skus } = await getAllData();
      
      // Create SKU Map for quick lookup
      const skuMap = new Map<string, string>();
      skus.forEach(s => skuMap.set(s.sku, s.group));

      // Consolidate Data (Join Records with SKUs)
      const consolidated = records.map(record => {
        if (record.source === '2026' && record.sku) {
           return {
             ...record,
             category: skuMap.get(record.sku) || 'Sin Asignar (Falta Master)'
           };
        }
        return record;
      });

      set({ storedFiles: files, unifiedData: consolidated, isLoading: false });
    } catch (e) {
      console.error("Error loading DB", e);
      set({ isLoading: false });
    }
  },

  uploadFile: async (file, type) => {
    set({ isLoading: true });
    try {
      const rawData = await parseExcel(file);
      const fileId = crypto.randomUUID();
      const now = Date.now();
      
      let records: SaleRecord[] = [];
      let skus: SkuMaster[] = [];
      let rowCount = 0;

      if (type === 'history2025') {
        records = processHistory2025(rawData, fileId);
        rowCount = records.length;
      } else if (type === 'report2026') {
        records = processReport2026(rawData, fileId);
        rowCount = records.length;
      } else if (type === 'skuMaster') {
        skus = processSkuMaster(rawData);
        rowCount = skus.length;
      }

      const newFile: StoredFile = {
        id: fileId,
        name: file.name,
        type,
        uploadDate: now,
        rowCount
      };

      // Persist to IndexedDB
      await saveFileWithRecords(newFile, records, skus);

      // Reload everything to ensure consistency (and re-apply SKU map to existing records)
      await get().loadInitialData();

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error al procesar el archivo. Verifique el formato.");
      set({ isLoading: false });
    }
  },

  deleteFile: async (fileId: string) => {
    if(!window.confirm("¿Estás seguro de borrar este archivo y sus datos?")) return;
    
    set({ isLoading: true });
    try {
      await dbDeleteFile(fileId);
      await get().loadInitialData();
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  }
}));
