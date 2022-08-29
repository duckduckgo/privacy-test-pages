// https://raw.githubusercontent.com/msandrini/minimal-indexed-db/master/index.js
/* eslint-disable promise/param-names */
/* exported DB */
const DB = function (dbName, key = 'id') {
    return new Promise((resolve, reject) => {
        const openDBRequest = window.indexedDB.open(dbName, 1);
        const storeName = `${dbName}_store`;
        let db;

        const _upgrade = () => {
            db = openDBRequest.result;
            db.createObjectStore(storeName, { keyPath: key });
        };

        const _query = (method, readOnly, param = null) =>
            new Promise((resolveQuery, rejectQuery) => {
                const permission = readOnly ? 'readonly' : 'readwrite';
                if (db.objectStoreNames.contains(storeName)) {
                    const transaction = db.transaction(storeName, permission);
                    const store = transaction.objectStore(storeName);
                    const isMultiplePut = method === 'put' && param && typeof param.length !== 'undefined';
                    let listener;
                    if (isMultiplePut) {
                        listener = transaction;
                        param.forEach((entry) => {
                            store.put(entry);
                        });
                    } else {
                        listener = store[method](param);
                    }
                    listener.oncomplete = (event) => {
                        resolveQuery(event.target.result);
                    };
                    listener.onsuccess = (event) => {
                        resolveQuery(event.target.result);
                    };
                    listener.onerror = (event) => {
                        rejectQuery(event);
                    };
                } else {
                    rejectQuery(new Error('Store not found'));
                }
            });

        const methods = {
            getEntry: keyToUse => _query('get', true, keyToUse),
            getAll: () => _query('getAll', true),
            put: entryData => _query('put', false, entryData),
            add: entryData => _query('put', false, entryData),
            deleteEntry: keyToUse => _query('delete', false, keyToUse),
            deleteAll: () => _query('clear', false),
            flush: () => _query('clear', false),
            count: () => _query('count', true)
        };

        const _successOnBuild = () => {
            db = openDBRequest.result;
            resolve(methods);
        };

        const _errorOnBuild = (e) => {
            reject(new Error(e));
        };

        openDBRequest.onupgradeneeded = _upgrade.bind(this);
        openDBRequest.onsuccess = _successOnBuild.bind(this);
        openDBRequest.onerror = _errorOnBuild.bind(this);
    });
};
