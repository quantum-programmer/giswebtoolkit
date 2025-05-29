import MapObject from '~/mapobject/MapObject';
import Utils from '~/services/Utils';

type KeyParams = {
    gmlId: string;
    serviceUrl: string;
    idLayer: string;
}

export default class ObjectStorage {
    private readonly storage = new Map<string, MapObject>();

    /**
     * Количество объектов
     * @property count {number}
     */
    get count(): number {
        return this.storage.size;
    }

    /**
     * Массив объектов
     * @property array {MapObject[]}
     */
    get array(): MapObject[] {
        return Array.from( this.storage.values() );
    }

    /**
     * Итератор по объектам
     * @property iterator {IterableIterator}
     */
    get iterator(): IterableIterator<MapObject> {
        return this.storage.values();
    }

    /**
     * Получить объект по ключу
     * @method getObjectByStorageKey
     * @param storageKey {string} Ключ объекта (ObjectStorage.generateKey(...))
     */
    getObject( storageKey: string ): MapObject | undefined {
        return this.storage.get( storageKey );
    }

    /**
     * Получить объект по идентификатору
     * @param id {string} Идентификатор объекта (GUID)
     */
    getObjectById( id: string ): MapObject | undefined {
        for ( const mapObject of this.iterator ) {
            if ( mapObject.id === id ) {
                return mapObject;
            }
        }
    }

    /**
     * Добавить объект
     * @method addObject
     * @param mapObject {MapObject} Объект карты
     */
    addObject( mapObject: MapObject ): true | undefined {
        let storageKey = mapObject.storageKey;
        if (mapObject.newFlag) {
            storageKey += '_' + Utils.generateGUID();
        }
        if ( !this.storage.has( storageKey ) ) {
            this.storage.set( storageKey, mapObject );
            return true;
        }
    }


    /**
     * Заменить объект
     * @method replaceObject
     * @param mapObject {MapObject} Объект карты
     */
    replaceObject( mapObject: MapObject ): true | undefined {
        const storageKey = mapObject.storageKey;
        const result = this.storage.has( storageKey ) || undefined;

        this.storage.set( storageKey, mapObject );
        return result;
    }


    /**
     * Удалить объект по ключу
     * @method removeObjectByStorageKey
     * @param storageKey {string} Ключ объекта (ObjectStorage.generateKey(...))
     */
    removeObject( storageKey: string ): true | undefined {
        if ( this.storage.has( storageKey ) ) {
            this.storage.delete( storageKey );
            return true;
        }
    }

    /**
     * Удалить объект по идентификатору
     * @method removeObjectById
     * @param id {string} Идентификатор объекта (GUID)
     */
    removeObjectById( id: string ): true | undefined {
        for ( const mapObject of this.iterator ) {
            if ( mapObject.id === id ) {
                return this.removeObject( mapObject.storageKey );
            }
        }
    }


    /**
     * Очистить
     * @method clear
     */
    clear(): true | undefined {
        if ( this.storage.size > 0 ) {
            this.storage.clear();
            return true;
        }
    }

    static generateStorageKey( { gmlId, serviceUrl, idLayer }: KeyParams ): string {
        return gmlId + serviceUrl + idLayer;
    }

}