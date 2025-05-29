/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Семантики объекта                         *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';
import { FeatureSemanticItem } from '~/utils/GeoJSON';


export enum MapObjectSemanticType {
    TUNDEFINED = -1, // Значение не установлено
    TSTRING = 0, // Символьная строка
    TNUMBER = 1, // Числовое значение
    TANYFILE = 9, // Ссылка на документ - имя файла зарегистрированного типа
    TBMPFILE = 10, // Имя файла BMP (устаревший тип, аналог TANYFILE)
    TOLEFILE = 11, // Имя файла, обрабатываемого OLE-сервером (устаревший тип, аналог TANYFILE)
    TREFER = 12, // Ссылка на произвольный объект карты (уникальный номер объекта)
    TMAPFILE = 13, // Ссылка на карту - имя файла-паспорта района
    TTXTFILE = 14, // Имя текстового файла (устаревший тип, аналог TANYFILE)
    TPCXFILE = 15, // Имя файла PCX (устаревший тип, аналог TANYFILE)
    TCODE = 16, // Значение в виде числового кода из классификатора значений
    TDATE = 17, // Значение даты в числовом виде (ГГГГММДД)
    TANGLE = 18, // Угловая величина в радианах
    TTIME = 19, // Значение времени в числовом виде (ЧЧММСС)
    TFONT = 20, // Имя шрифта ("Arial", "Courier"...)
    TCOLOR = 21, // Числовое значение цвета в RGB
    TFDIGITAL = 22, // Семантика типа формула числовая (с вычисляемыми значениями)
    TFSTRING = 23, // Семантика типа формула символьная (с вычисляемыми значениями)
    TGUID = 24, // Символьная строка, содержащая GUID (например, A9FC5EDD-CFF3-42bb-AC06-7941C6446FB5)
    TFDIGITALCOMBI = 25,// Семантика типа формула числовая (с вычисляемыми значениями) и ссылками на другие семантики типа формула
    TLAST = 25, // ВЕРХНЯЯ ГРАНИЦА СПИСКА КОДОВ
    TDOCREFMIN = 9, // НИЖНЯЯ ГРАНИЦА ТИПА СЕМАНТИКИ - ССЫЛКА НА ДОКУМЕНТ (ГРАФИЧЕСКИЙ ФАЙЛ, КАРТА)
    TDOCREFMAX = 15 // НИЖНЯЯ ГРАНИЦА ТИПА СЕМАНТИКИ - ССЫЛКА НА ДОКУМЕНТ (ГРАФИЧЕСКИЙ ФАЙЛ, КАРТА)
}

export type SemanticsStore = FeatureSemanticItem[];

export default class MapObjectSemantics {

    protected semanticStore: SemanticsStore = [];

    private getSemanticIndex( key: string ) {
        return this.semanticStore.findIndex( semantic => semantic.key === key );
    }

    getFirstSemantic( key: string ) {
        const result = this.semanticStore.find( semantic => semantic.key === key );
        if ( result ) {
            return { ...result };
        }
    }

    getSemantics() {
        return this.semanticStore.map( semantic => ({ ...semantic }) );
    }

    getRepeatableSemantics( key: string ) {
        const result: FeatureSemanticItem[] = [];
        this.semanticStore.forEach( (semantic => {
            if ( semantic.key === key ) {
                result.push( { ...semantic } );
            }
        }) );
        return result;
    }

    getRepeatableSemanticsByCode( code: string ) {
        const result: FeatureSemanticItem[] = [];
        this.semanticStore.forEach( (semantic => {
            if ( semantic.code === code ) {
                result.push( { ...semantic } );
            }
        }) );
        return result;
    }

    addUniqueSemantic( semantic: FeatureSemanticItem ) {
        const existedSemantic = this.semanticStore.find( currentSemantic => MapObjectSemantics.semanticEqual( currentSemantic, semantic ) );
        if ( !existedSemantic ) {
            this.semanticStore.push( semantic );
        }
    }

    addRepeatableSemantic( semantic: FeatureSemanticItem ) {
        this.semanticStore.push( semantic );
    }

    addUniqueSemantics( semantics: FeatureSemanticItem[] ) {
        for ( let semantic of semantics ) {
            this.addUniqueSemantic( semantic );
        }
    }

    setFirstSemanticValue( key: string, value: string ) {
        const semanticIndex = this.getSemanticIndex( key );
        if ( semanticIndex !== -1 ) {
            const semantic = this.semanticStore[ semanticIndex ];
            semantic.value = value;
            this.semanticStore.splice( semanticIndex, 1, semantic );
        }
    }

    setRepeatableSemanticValue( key: string, index: number, value: string ) {
        let semanticIndex = -1;
        for ( let i = 0; index >= 0 && i < this.semanticStore.length; i++ ) {
            const semantic = this.semanticStore[ i ];
            if ( semantic.key === key ) {
                semanticIndex = i;
                index--;
            }
        }
        if ( semanticIndex !== -1 && index < 0 ) {
            const semantic = this.semanticStore[ semanticIndex ];
            semantic.value = value;
            this.semanticStore.splice( semanticIndex, 1, semantic );
        }
    }


    setRepeatableSemanticValues( key: string, values: string[] ) {
        const currentSemantics = this.getRepeatableSemantics( key );
        if ( currentSemantics && currentSemantics.length >= values.length ) {
            values.forEach( ( value, index ) => {
                const semanticIndex = this.semanticStore.findIndex( ( semantic ) => MapObjectSemantics.semanticEqual( semantic, currentSemantics[ index ] ) );
                if ( semanticIndex !== -1 ) {
                    const semantic = this.semanticStore[ semanticIndex ];
                    semantic.value = value;
                    this.semanticStore.splice( semanticIndex, 1, semantic );
                }
            } );
        }
    }

    getUniqueSemanticValue( key: string ) {
        const currentSemantic = this.semanticStore.find( semantic => semantic.key === key );
        if ( currentSemantic ) {
            return currentSemantic.value;
        }
    }

    getRepeatableSemanticValues( key: string ) {
        const result: string[] = [];
        this.semanticStore.forEach( (semantic => {
            if ( semantic.key === key ) {
                result.push( semantic.value );
            }
        }) );
        return result;
    }

    getRepeatableSemanticValuesByCode( code: string ) {
        const result: string[] = [];
        this.semanticStore.forEach( (semantic => {
            if ( semantic.code === code ) {
                result.push( semantic.value );
            }
        }) );
        return result;
    }

    getSemanticUniqKeys() {
        const result: string[] = [];
        this.semanticStore.forEach( (semantic => {
            if ( !result.includes( semantic.key ) ) {
                result.push( semantic.key );
            }
        }) );
        return result;
    }

    getSemanticUniqCodes() {
        const result: string[] = [];
        this.semanticStore.forEach( (semantic => {
            if ( semantic.code && !result.includes( semantic.code ) ) {
                result.push( semantic.code );
            }
        }) );
        return result;
    }

    removeUniqueSemantic( semanticKey: string ) {
        const index = this.semanticStore.findIndex( semantic => semantic.key === semanticKey );
        if ( index !== -1 ) {
            this.semanticStore.splice( index, 1 );
        }
    }

    removeExactSemantic( semanticKey: string, semanticValue: string ) {
        const index = this.semanticStore.findIndex( semantic => semantic.key === semanticKey && semantic.value === semanticValue );
        if ( index !== -1 ) {
            this.semanticStore.splice( index, 1 );
        }
    }

    removeExactSemanticByCode( semanticCode: string, semanticValue: string ) {
        const index = this.semanticStore.findIndex( semantic => semantic.code === semanticCode && semantic.value === semanticValue );
        if ( index !== -1 ) {
            this.semanticStore.splice( index, 1 );
        }
    }


    removeRepeatableSemantic( key: string, index: number ) {
        let semanticIndex = -1;
        for ( let i = 0; index >= 0 && i < this.semanticStore.length; i++ ) {
            const semantic = this.semanticStore[ i ];
            if ( semantic.key === key ) {
                semanticIndex = i;
                index--;
            }
        }
        if ( semanticIndex !== -1 && index < 0 ) {
            this.semanticStore.splice( semanticIndex, 1 );
        }
        // const currentSemantics = this.getRepeatableSemantics( key )[ index ];
        // if ( currentSemantics ) {
        //         if ( index === undefined ) {
        //             currentSemantics.forEach( currentSemantic => {
        //                 const semanticIndex = this.semanticStore.findIndex( ( semantic ) => MapObjectSemantics.semanticEqual( semantic, currentSemantic ) );
        //                 if ( semanticIndex !== -1 ) {
        //                     this.semanticStore.splice( semanticIndex, 1 );
        //                 }
        //             } );
        //         } else if ( index < this.semanticStore.length ) {
        // const semanticIndex = this.semanticStore.findIndex( ( semantic ) => MapObjectSemantics.semanticEqual( semantic, currentSemantics[ index ] ) );
        // if ( semanticIndex !== -1 ) {
        //     this.semanticStore.splice( semanticIndex, 1 );
        // }
        // }
        // }
    }

    clear() {
        this.semanticStore.splice( 0 );
    }

    equals( other: MapObjectSemantics ) {

        if ( this.semanticStore.length !== other.semanticStore.length ) {
            return false;
        }

        for ( let i = 0; i < this.semanticStore.length; i++ ) {
            const semantic1 = this.semanticStore[ i ];
            const semantic2 = other.semanticStore.find( semantic => MapObjectSemantics.semanticEqual( semantic, semantic1 ) );
            if ( !semantic2 ) {
                return false;
            }
        }

        return true;
    }

    updateFrom( other: MapObjectSemantics ) {
        this.clear();
        for ( let i = 0; i < other.semanticStore.length; i++ ) {
            const semantic = other.semanticStore[ i ];
            this.addRepeatableSemantic( { ...semantic } );
        }
    }

    toJSON() {
        const result: SimpleJson<FeatureSemanticItem[]> = { semantics: [] };
        this.semanticStore.forEach( semantic => result.semantics.push( { ...semantic } ) );
        return result;
    }

    private static semanticEqual( semantic1: FeatureSemanticItem, semantic2: FeatureSemanticItem ) {
        return semantic1.key === semantic2.key && semantic1.value === semantic2.value && semantic1.name === semantic2.name;
    }
}
