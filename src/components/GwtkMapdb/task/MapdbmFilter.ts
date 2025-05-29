/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Создание данных для поиска                    *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';


type DbRequestData = {
    limit?: string,
    offset?: string,
    searchLogic?: string,
    cmd?: string,
    layer_id?: string,
    filepath?: string,
};

type ValueData = { [ key: string ]: string | number | undefined | string[] };

// fixme: Не лучше ли экземпляр делать фильтра вместо статики?

export default class MapdbmFilter {

    static data: DbRequestData = {
        limit: '10',
        offset: '0',
        searchLogic: 'OR',
        cmd: 'getrecords',
        layer_id: '',
        filepath: '',
    };

    static createRequestData( data: DbRequestData ) {
        return { ...this.data, ...data };
    }

    static createFastSearchData( value: string, filter: { field: string; column_type: string }[], layer_id: string, filepath: string ) {
        const params: string[] = [];
        let counter = 0;
        if ( filter.length === 1 ) {
            params.push( `search[${counter}][field]=${filter[ 0 ].field}` );
            params.push( `search[${counter}][type]=${filter[ 0 ].column_type}` );
            params.push( `search[${counter}][value]=${value}` );
            if ( filter[ 0 ].column_type != 'varchar' && Number( value ) ) {
                params.push( `search[${counter}][operator]=is` );
            } else {
                params.push( `search[${counter}][operator]=contains` );
            }
        } else {
            for ( let i = 0; i < filter.length; i++ ) {
                if ( filter[ i ].column_type != 'varchar' && !Number( value ) ) {
                    continue;
                }
                params.push( `search[${counter}][field]=${filter[ i ].field}` );
                params.push( `search[${counter}][type]=${filter[ i ].column_type}` );
                params.push( `search[${counter}][value]=${value}` );
                if ( filter[ i ].column_type != 'varchar' && Number( value ) ) {
                    params.push( `search[${counter}][operator]=is` );
                } else {
                    params.push( `search[${counter}][operator]=contains` );
                }
                counter++;
            }
        }

        if ( params.length > 0 ) {
            return { url: { ...this.data, layer_id, filepath }, body: params.join( '&' ) };
        }
    }

    static createMapSearchData( value: { sheetName: string; objectNumber: number; }[] | MapObject[], filepath: string, layer_id: string ) {
        const filePath = filepath.replace( 'layers/', '' ).replace( '.dbm', '' );
        let valueData: ValueData = {};
        let counter = 0;
        for ( let i = 0; i < value.length; i++ ) {
            if ( value[ i ].sheetName == filePath ) {
                valueData[ `search[${counter}][field]` ] = 'id';
                valueData[ `search[${counter}][type]` ] = 'int8';
                valueData[ `search[${counter}][operator]` ] = 'is';
                valueData[ `search[${counter}][value]` ] = value[ i ].objectNumber;
                counter++;
            }
        }

        return { ...this.data, layer_id, filepath, ...valueData };
    }

    static createAdvancedSearchRequest( filter: { field?: string; column_type?: string; operator?: string; value1?: string; value2?: string }[], layer_id: string, filepath: string ) {
        const valueData: ValueData = {};
        for ( let i = 0; i < filter.length; i++ ) {
            const currentFilter = filter[ i ];
            valueData[ `search[${i}][field]` ] = currentFilter.field;
            valueData[ `search[${i}][type]` ] = currentFilter.column_type;
            valueData[ `search[${i}][operator]` ] = currentFilter.operator;
            if ( currentFilter.value1 !== undefined && currentFilter.value2 ) {
                valueData[ `search[${i}][value]` ] = [currentFilter.value1, currentFilter.value2];
            } else {
                valueData[ `search[${i}][value]` ] = currentFilter.value1;
            }
        }
        return { ...this.data, searchLogic: 'AND', layer_id, filepath, ...valueData };
    }
}
