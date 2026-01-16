import { read, utils } from 'xlsx';
import { SaleRecord, SkuMaster } from '../types';

// Helper to convert Excel serial date to YYYY-MM-DD
const parseExcelDate = (value: any): string => {
  if (!value) return '';
  
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof value === 'string') {
    const parts = value.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return String(value);
};

const safeStr = (val: any): string => {
  return val === null || val === undefined ? '' : String(val).trim();
};

const cleanStoreName = (rawName: any): string => {
  let str = safeStr(rawName);
  if (!str) return 'Desconocida';
  let cleaned = str.replace(/^SODIMAC\s*-\s*/i, '');
  cleaned = cleaned.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return cleaned.trim();
};

export const parseExcel = async (file: File): Promise<any[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return utils.sheet_to_json(worksheet, { header: 1 });
};

// --- Processors now require fileId to generate unique record IDs ---

export const processHistory2025 = (data: any[], fileId: string): SaleRecord[] => {
  const headerIndex = data.findIndex(row => 
    row.some((cell: any) => safeStr(cell).toLowerCase().includes('fecha'))
  );

  if (headerIndex === -1) return [];

  const headers = data[headerIndex].map((h: any) => safeStr(h).toLowerCase());
  const rows = data.slice(headerIndex + 1);

  const idxDate = headers.indexOf('fecha');
  const idxStore = headers.indexOf('tienda');
  const idxGroup = headers.indexOf('grupo');
  const idxDesc = headers.indexOf('descripcion');
  const idxQty = headers.findIndex((h: string) => h.includes('cantidad') || h.includes('cant'));

  return rows.map((row, index) => {
    if (!row[idxDate]) return null;

    return {
      id: `${fileId}-${index}`,
      fileId: fileId,
      date: parseExcelDate(row[idxDate]),
      store: cleanStoreName(row[idxStore]),
      category: safeStr(row[idxGroup]) || 'Sin Categoría',
      product: safeStr(row[idxDesc]) || 'Producto Desconocido',
      quantity: parseInt(row[idxQty]) || 0,
      revenue: 0,
      sku: null,
      source: '2025'
    };
  }).filter(Boolean) as SaleRecord[];
};

export const processReport2026 = (data: any[], fileId: string): SaleRecord[] => {
  const headerIndex = data.findIndex(row => 
    row.some((cell: any) => {
      const s = safeStr(cell).toLowerCase();
      return s.includes('fecha final') || s.includes('ean') || (s.includes('descripción') && row.length > 5);
    })
  );

  if (headerIndex === -1) return [];

  const headers = data[headerIndex].map((h: any) => safeStr(h).toLowerCase());
  const rows = data.slice(headerIndex + 1);

  const idxDate = headers.findIndex((h: string) => h.includes('fecha final') || h.includes('fecha'));
  const idxStore = 1; 
  const idxProduct = headers.findIndex((h: string) => h.includes('descripción del ítem') || h.includes('descripcion del item') || h.includes('artículo'));
  const idxQty = headers.findIndex((h: string) => h.includes('cantidad vendida') || h.includes('unidades'));
  const idxSku = headers.findIndex((h: string) => h.includes('código de ítem') || h.includes('sku') || h.includes('comprador'));
  const idxRevenue = headers.findIndex((h: string) => h.includes('precio neto') || h.includes('venta neta') || h.includes('revenue'));

  return rows.map((row, index) => {
    if (!row[idxDate] && !row[idxSku]) return null;

    const sku = safeStr(row[idxSku]);
    
    let revRaw = row[idxRevenue];
    let revenue = 0;
    if (typeof revRaw === 'string') {
        revRaw = revRaw.replace(/[$,]/g, '');
        revenue = parseFloat(revRaw) || 0;
    } else if (typeof revRaw === 'number') {
        revenue = revRaw;
    }

    return {
      id: `${fileId}-${index}`,
      fileId: fileId,
      date: parseExcelDate(row[idxDate]),
      store: cleanStoreName(row[idxStore]),
      product: safeStr(row[idxProduct]) || 'Desconocido',
      quantity: parseInt(row[idxQty]) || 0,
      sku: sku,
      revenue: revenue,
      category: 'Pendiente', // Will be enriched in the Store using DB SKUs
      source: '2026'
    };
  }).filter(Boolean) as SaleRecord[];
};

export const processSkuMaster = (data: any[]): SkuMaster[] => {
  const headerIndex = data.findIndex(row => 
    row.some((cell: any) => {
      const s = safeStr(cell).toLowerCase();
      return s.includes('sku') || s.includes('item');
    })
  );
  
  if (headerIndex === -1) return [];

  const headers = data[headerIndex].map((h: any) => safeStr(h).toLowerCase());
  const rows = data.slice(headerIndex + 1);
  
  const idxSku = headers.findIndex((h: string) => h.includes('sku') || h.includes('item') || h.includes('codigo'));
  const idxDesc = headers.findIndex((h: string) => h.includes('descripcion'));
  const idxGroup = headers.findIndex((h: string) => h.includes('grupo') || h.includes('categoria'));

  return rows.map(row => ({
    sku: safeStr(row[idxSku]),
    description: safeStr(row[idxDesc]),
    group: safeStr(row[idxGroup])
  })).filter(item => item.sku);
};
