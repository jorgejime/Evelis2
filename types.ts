export interface SaleRecord {
  id: string; // Composite ID or DB ID
  fileId: string; // Foreign key to StoredFile
  date: string; // YYYY-MM-DD
  store: string;
  category: string;
  product: string;
  quantity: number;
  revenue: number;
  sku: string | null;
  source: '2025' | '2026';
}

export interface SkuMaster {
  sku: string;
  description: string;
  group: string;
  fileId?: string;
}

export interface StoredFile {
  id: string;
  name: string;
  type: FileType;
  uploadDate: number;
  rowCount: number;
}

export interface ProcessingStats {
  totalRows: number;
  historyRows: number;
  reportRows: number;
  mappedRows: number;
  missingSkus: number;
}

export type FileType = 'history2025' | 'report2026' | 'skuMaster';