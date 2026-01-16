import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SaleRecord, SkuMaster, StoredFile, FileType } from '../types';

interface SalesDB extends DBSchema {
  files: {
    key: string;
    value: StoredFile;
  };
  records: {
    key: string;
    value: SaleRecord;
    indexes: { 'by-file': string };
  };
  skus: {
    key: string; // sku code
    value: SkuMaster;
  };
}

const DB_NAME = 'sales-bi-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<SalesDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for File Metadata
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
      // Store for Sales Records
      if (!db.objectStoreNames.contains('records')) {
        const store = db.createObjectStore('records', { keyPath: 'id' });
        store.createIndex('by-file', 'fileId');
      }
      // Store for SKU Master (Unique SKUs)
      if (!db.objectStoreNames.contains('skus')) {
        db.createObjectStore('skus', { keyPath: 'sku' });
      }
    },
  });
};

export const saveFileWithRecords = async (
  fileMeta: StoredFile, 
  records: SaleRecord[], 
  skus: SkuMaster[] = []
) => {
  const db = await initDB();
  const tx = db.transaction(['files', 'records', 'skus'], 'readwrite');
  
  // Save metadata
  await tx.objectStore('files').put(fileMeta);

  // Save records
  if (records.length > 0) {
    const recordStore = tx.objectStore('records');
    for (const record of records) {
      await recordStore.put(record);
    }
  }

  // Save SKUs (upsert)
  if (skus.length > 0) {
    const skuStore = tx.objectStore('skus');
    for (const sku of skus) {
      await skuStore.put(sku);
    }
  }

  await tx.done;
};

export const deleteFile = async (fileId: string) => {
  const db = await initDB();
  const tx = db.transaction(['files', 'records', 'skus'], 'readwrite');
  
  // 1. Get file meta to check type
  const file = await tx.objectStore('files').get(fileId);
  
  // 2. Delete from files store
  await tx.objectStore('files').delete(fileId);

  // 3. Delete associated records
  const recordStore = tx.objectStore('records');
  const index = recordStore.index('by-file');
  
  // Iterate and delete keys (cursor is more efficient for bulk delete but getAllKeys + loop is simpler to write)
  const keys = await index.getAllKeys(fileId);
  for (const key of keys) {
    await recordStore.delete(key);
  }

  // 4. If it was an SKU file, we ideally should clear SKUs linked to this file. 
  // However, since SKUs are unique by code and might be merged, detailed cleanup is complex.
  // For this MVP, if type is skuMaster, we assume we might want to clear ALL skus or handle it differently.
  // Let's implement a simple clear for SKUs if the file type matches.
  if (file?.type === 'skuMaster') {
     // NOTE: This clears ALL SKUs. In a real ERP, we'd track source_file_id per SKU.
     // For this requirement "allow delete", clearing all masters is safer than leaving stale ones.
     await tx.objectStore('skus').clear();
  }

  await tx.done;
};

export const getAllData = async () => {
  const db = await initDB();
  return {
    files: await db.getAll('files'),
    records: await db.getAll('records'),
    skus: await db.getAll('skus'),
  };
};
