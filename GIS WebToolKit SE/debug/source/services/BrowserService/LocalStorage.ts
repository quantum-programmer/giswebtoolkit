import { SimpleJson } from '~/types/CommonTypes';

/**
 * Класс взаимодействия с localStorage браузера
 * @static
 * @class LocalStorage
 */
export class LocalStorage {

    /**
     * Поместить данные в localStorage
     * @static
     * @method setItem
     * @param key {string} Ключ в localStorage
     * @param value {string|SimpleJson} Данные
     */
    static setItem<T extends SimpleJson<any>>( key: string, value: string | T ) {
        if ( localStorage ) {
            let storageData;
            if ( typeof value !== 'string' ) {
                storageData = JSON.stringify( value );
            } else {
                storageData = value;
            }
            localStorage.setItem( key, storageData );
        }
    }

    /**
     * Получить данные из localStorage
     * @static
     * @method getItem
     * @param key {string} Ключ в localStorage
     * @param [jsonFlag] {boolean} Преобразовать строку в JSON формат
     * @return {string|SimpleJson|undefined} Данные из localStorage
     */
    static getItem<T>( key: string, jsonFlag = false ): T | undefined {
        let result;
        if ( localStorage ) {
            const storageData = localStorage.getItem( key );
            if ( storageData !== null ) {
                if ( jsonFlag ) {
                    result = JSON.parse( storageData );
                    if ( !result ) {
                        result = undefined;
                    }
                } else {
                    result = storageData;
                }
            }
        }
        return result;
    }

    /**
     * Удалить данные из localStorage
     * @static
     * @method removeItem
     * @param key {string} Ключ в localStorage
     */
    static removeItem( key: string ) {
        if ( this.getItem( key ) !== undefined ) {
            localStorage.removeItem( key );
        }
    }

    /**
     * Проверить доступность localStorage.
     * @static
     * @method checkLocalStorageAvailability
     */
    static checkLocalStorageAvailability() {
        try {
            localStorage;
        } catch (error) {
            console.log('Browser security policy does not allow use of local data storage. Application may not work correctly. ' +
                'Unblock access in your browser settings or add to list of trusted sites: ' + location.host);
            // console.log(w2utils.lang('Browser security policy does not allow use of local data storage. Application may not work correctly. ' +
            //     'Unblock access in your browser settings or add to list of trusted sites: ') + location.host);
        }
    }

}
