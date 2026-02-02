import { IDBMigrationFunction } from "./lib/dbHelpers";

const tables = ["files", "directories"] as const;
type Table = (typeof tables)[number];

export interface LocalDirectory {
  handle: FileSystemDirectoryHandle;
  name: FileSystem["name"];
  lastOpened: number; // Date.now()
}

export interface LocalFile {
  handle: FileSystemFileHandle;
  name: File["name"];
  lastOpened: number; // Date.now()
}

export type WithKey<T> = T & { key: IDBValidKey };

export interface LocalDirectoryWithKey extends LocalDirectory {
  key: IDBValidKey;
}

export interface LocalFileWithKey extends LocalFile {
  key: IDBValidKey;
}

export const migrations: IDBMigrationFunction[] = [
  // add files Store
  (db) =>
    new Promise<void>((resolve, reject) => {
      const objectStore = db.createObjectStore("files", {
        autoIncrement: true,
      });

      objectStore.createIndex("lastOpened", "lastOpened", { multiEntry: true });

      objectStore.transaction.oncomplete = () => resolve();
      objectStore.transaction.onerror = reject;
    }),
  // add directory table
  (db) =>
    new Promise<void>((resolve, reject) => {
      const objectStore = db.createObjectStore("directories", {
        autoIncrement: true,
      });
      objectStore.createIndex("lastOpened", "lastOpened", { multiEntry: true });

      objectStore.transaction.oncomplete = () => resolve();
      objectStore.transaction.onerror = () => reject();
    }),
];

export const addDirectoryToDb = (db: IDBDatabase, directory: LocalDirectory) =>
  new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db
      .transaction("directories", "readwrite")
      .objectStore("directories")
      .add(directory);
    transaction.onsuccess = () => resolve(transaction.result);
    transaction.onerror = reject;
  });

export const addFileToDb = (db: IDBDatabase, file: LocalFile) =>
  new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db
      .transaction("files", "readwrite")
      .objectStore("files")
      .add(file);

    transaction.onsuccess = () => resolve(transaction.result);
    transaction.onerror = reject;
  });

export const findInDb = <T extends LocalDirectory | LocalFile>(
  db: IDBDatabase,
  objectStoreName: Table,
  handle: T["handle"],
) =>
  new Promise<WithKey<T>>((resolve, reject) => {
    const objectStore = db
      .transaction(objectStoreName, "readonly")
      .objectStore(objectStoreName);
    const entriesRequest = objectStore.getAll();
    const keysRequest = objectStore.getAllKeys();

    Promise.all([
      new Promise<T[]>((resolve, reject) => {
        entriesRequest.onsuccess = () => resolve(entriesRequest.result as T[]);
        entriesRequest.onerror = () => reject(entriesRequest.error);
      }),
      new Promise<IDBValidKey[]>((resolve, reject) => {
        keysRequest.onsuccess = () => resolve(keysRequest.result);
        keysRequest.onerror = () => reject(keysRequest.error);
      }),
    ])
      .then(async ([entries, keys]) => {
        for (let i = 0; i <= entries.length; i++) {
          const entry = entries[i];
          if (await entry.handle.isSameEntry(handle)) {
            resolve({ ...entry, key: keys[i] });
            return;
          }
        }
        reject("not found");
        entriesRequest.onerror = () => reject(entriesRequest.error);
      })
      .catch((error) => {
        reject(error);
      });
  });

export const findFileInDb = (
  db: IDBDatabase,
  fileHandle: LocalFile["handle"],
) => findInDb(db, "files", fileHandle);

export const findDirectoryInDb = (
  db: IDBDatabase,
  directoryHandle: LocalDirectory["handle"],
) => findInDb(db, "directories", directoryHandle);

export const removeDirectoryFromDb = (db: IDBDatabase, key: IDBValidKey) =>
  new Promise<void>((resolve, reject) => {
    const request = db
      .transaction("directories", "readwrite")
      .objectStore("directories")
      .delete(key);

    request.onsuccess = () => resolve();
    request.onerror = (error) => reject(error);
  });

export const removeFilefromDb = (db: IDBDatabase, key: IDBValidKey) =>
  new Promise<void>((resolve, reject) => {
    const request = db
      .transaction("files", "readwrite")
      .objectStore("files")
      .delete(key);

    request.onsuccess = () => resolve();
    request.onerror = (error) => reject(error);
  });
