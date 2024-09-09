import { IDBMigrationFunction } from "./lib/dbHelpers";

export interface LocalFile {
  fileHandle: FileSystemFileHandle;
  name: File["name"];
  lastOpened: number; // Date.now()
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
];

export const addFileToDb = (db: IDBDatabase, file: LocalFile) =>
  new Promise<IDBValidKey>((resolve, reject) => {
    const transaction = db
      .transaction("files", "readwrite")
      .objectStore("files")
      .add(file);

    transaction.onsuccess = () => {
      resolve(transaction.result);
    };
    transaction.onerror = reject;
  });

export const findFileInDb = (
  db: IDBDatabase,
  fileHandle: LocalFile["fileHandle"]
) =>
  new Promise<LocalFileWithKey>((resolve, reject) => {
    // cannot use cursor beacuse you cannot do async operations in the middle of indexedDB operations
    // const request = db
    //   .transaction("files", "readonly")
    //   .objectStore("files")
    //   .openCursor();
    // request.onsuccess = async () => {
    //   const cursor = request.result;
    //   if (cursor === null) {
    //     reject();
    //     return;
    //   }
    //   const file = cursor.value as LocalFile;
    //   if (await file.fileHandle.isSameEntry(fileHandle)) {
    //     resolve({ ...file, key: cursor.key });
    //     return;
    //   } else cursor.continue();
    // };
    // request.onerror = () => {
    //   console.error(request.error);
    //   reject(request.error);
    // };

    const objectStore = db
      .transaction("files", "readonly")
      .objectStore("files");

    const entriesRequest = objectStore.getAll();
    const keysRequest = objectStore.getAllKeys();

    Promise.all([
      new Promise<LocalFile[]>((resolve, reject) => {
        entriesRequest.onsuccess = () =>
          resolve(entriesRequest.result as LocalFile[]);
        entriesRequest.onerror = () => reject(entriesRequest.error);
      }),
      new Promise<IDBValidKey[]>((resolve, reject) => {
        keysRequest.onsuccess = () =>
          resolve(keysRequest.result as LocalFileWithKey["key"][]);
        keysRequest.onerror = () => reject(keysRequest.error);
      }),
    ])
      .then(async ([entries, keys]) => {
        for (let i = 0; i <= entries.length; i++) {
          const entry = entries[i];
          if (await entry.fileHandle.isSameEntry(fileHandle)) {
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

export const removeFilefromDb = (db: IDBDatabase, key: IDBValidKey) =>
  new Promise<void>((resolve, reject) => {
    const request = db
      .transaction("files", "readwrite")
      .objectStore("files")
      .delete(key);

    request.onsuccess = () => resolve();
    request.onerror = (error) => reject(error);
  });
