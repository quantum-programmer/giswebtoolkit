import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { LogEventType, SimpleJson } from '~/types/CommonTypes';
import { StoreNames } from 'idb/build/entry';


export interface DBStructure extends DBSchema {
    [ name: string ]: {
        key: string;
        value: SimpleJson<any>;
    };
}


/**
 * Класс взаимодействия с IndexedDB браузера
 * @static
 * @class IndexedDBStorage
 */
export class IndexedDBStorage {

    static async retrieveStorage( dbName: string, storageName: StoreNames<DBStructure> ): Promise<IndexedDBStorage | undefined> {

        if ( (self || window).indexedDB ) {
            try {

                let db = await openDB<DBStructure>( dbName );

                if ( !db.objectStoreNames.contains( storageName ) ) {

                    const version = db.version + 1;
                    db.close();

                    db = await openDB<DBStructure>(dbName, version, {
                        upgrade: (db) => {
                            db.createObjectStore(storageName);
                        },
                    });
                }

                return new IndexedDBStorage(storageName, db);
            } catch (error) {
                console.error('IndexedDBStorage:retrieveStorage - unable to open DB');
            }
        }
    }

    private constructor( readonly storageName: StoreNames<DBStructure>, private readonly db: IDBPDatabase<DBStructure> ) {

    }

    /**
     * Поместить данные в localStorage
     * @static
     * @method setItem
     * @param key {string} Ключ в localStorage
     * @param value {string|SimpleJson} Данные
     */
    setItem<T extends SimpleJson<any>>( key: string, value: T ) {
        return this.db.put( this.storageName, value, key );
    }

    /**
     * Получить данные из localStorage
     * @static
     * @method getItem
     * @param key {string} Ключ в localStorage
     * @param [jsonFlag] {boolean} Преобразовать строку в JSON формат
     * @return {string|SimpleJson|undefined} Данные из localStorage
     */
    async getItem<T extends SimpleJson<any>>( key: string, jsonFlag = false ): Promise<T | undefined> {
        return await this.db.get( this.storageName, key ) as T;
    }

    async getAllKeys(): Promise<string[]> {
        return await this.db.getAllKeys( this.storageName );
    }

    /**
     * Удалить данные из localStorage
     * @static
     * @method removeItem
     * @param key {string} Ключ в localStorage
     */
    async removeItem( key: string ) {
        if ( await this.getItem( key ) !== undefined ) {
            return await this.db.delete( this.storageName, key );
        }
    }

    close() {
        return this.db.close();
    }
}
