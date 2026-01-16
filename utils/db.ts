import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SaleRecord, SkuMaster, StoredFile, FileType, InventoryRecord } from '../types';

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
  inventory: {
    key: string;
    value: InventoryRecord;
    indexes: { 'by-file': string };
  };
}

const DB_NAME = 'sales-bi-db';
const DB_VERSION = 2;

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
      // Store for Inventory Records
      if (!db.objectStoreNames.contains('inventory')) {
        const store = db.createObjectStore('inventory', { keyPath: 'id' });
        store.createIndex('by-file', 'fileId');
      }
    },
  });
};

export const saveFileWithRecords = async (
  fileMeta: StoredFile,
  records: SaleRecord[] = [],
  skus: SkuMaster[] = [],
  inventory: InventoryRecord[] = []
) => {
  const db = await initDB();
  const tx = db.transaction(['files', 'records', 'skus', 'inventory'], 'readwrite');

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

  // Save inventory
  if (inventory.length > 0) {
    const inventoryStore = tx.objectStore('inventory');
    for (const item of inventory) {
      await inventoryStore.put(item);
    }
  }

  await tx.done;
};

export const deleteFile = async (fileId: string) => {
  const db = await initDB();
  const tx = db.transaction(['files', 'records', 'skus', 'inventory'], 'readwrite');

  // 1. Get file meta to check type
  const file = await tx.objectStore('files').get(fileId);

  // 2. Delete from files store
  await tx.objectStore('files').delete(fileId);

  // 3. Delete associated records
  const recordStore = tx.objectStore('records');
  const recordIndex = recordStore.index('by-file');

  const recordKeys = await recordIndex.getAllKeys(fileId);
  for (const key of recordKeys) {
    await recordStore.delete(key);
  }

  // 4. Delete associated inventory
  const inventoryStore = tx.objectStore('inventory');
  const inventoryIndex = inventoryStore.index('by-file');

  const inventoryKeys = await inventoryIndex.getAllKeys(fileId);
  for (const key of inventoryKeys) {
    await inventoryStore.delete(key);
  }

  // 5. If it was an SKU file, clear all SKUs
  if (file?.type === 'skuMaster') {
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
    inventory: await db.getAll('inventory'),
  };
};
