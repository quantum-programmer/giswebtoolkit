/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Набор классов обработки сообщений потока              *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';
import { AxiosRequestConfig } from 'axios';
import {
    Get3dMaterialsParams,
    Get3dTexturesParams,
    Get3dTilesParams,
    GetCoverageTileParams,
    GetCoverageTilesHeaderParams,
    GetFeatureParams,
    GetScenarioParams,
    GetTrackParams
} from '~/services/RequestServices/RestService/Types';
import {
    Desc3dMaterial,
    Desc3dTexture,
    IMG3DRGBA,
    Metadata,
    Model,
    ParserTiles3d,
    Primitive,
    Tile3D
} from '~/3d/engine/worker/workerscripts/parse3dtiles';
import Utils from '~/services/Utils';
import ModelPrimitive3d, { ModelPrimitive3dSerialized } from '~/3d/engine/worker/workerscripts/modelprimitive3d';
import { Vector3D, Vector4D } from '~/3d/engine/core/Types';
import Object3dCreator from '~/3d/engine/worker/workerscripts/object3dcreator';
import { IMG3DVALUE } from '~/3d/engine/worker/workerscripts/parse3dobject';
import { FeatureMesh, TemplateOptions, VIEWTYPE } from '~/3d/engine/worker/workerscripts/object3dtemplate';
import { MessageState, QueueObject } from '~/3d/engine/worker/workerscripts/queue';
import { CrsType, ProjectionCollection } from '~/3d/engine/core/geometry/projection';
import GeoJSON from '~/utils/GeoJSON';
import TileIdentifier from '~/3d/engine/scene/terrain/tileidentifier';
import HeightTile, { HeightTileSerialised } from '~/3d/engine/scene/terrain/heightsource/heighttile';
import { MaterialIdentifier, TextureIdentifier } from '~/3d/engine/scene/terrain/db3dsource/tile3didentifier';
import OrientedBoundingBox3D from '~/3d/engine/core/boundingvolumes/orientedbbox3d';
import BoundingSphere3D from '~/3d/engine/core/boundingvolumes/boundingsphere3d';
import { vec3 } from '~/3d/engine/utils/glmatrix';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { BoundingVolume3DSerialized } from '~/3d/engine/core/boundingvolumes/Types';
import GwtkError from '~/utils/GwtkError';

type FeatureMeshCollection = { features: FeatureMesh[]; minDistance: number; };

/**
 * Класс загрузки изображений
 * @class ImageLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class ImageLoader extends QueueObject<{ serviceUrl: string; url: string; }, { imageSrc?: string; }> {


    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;
        const serviceUrl = this.params.serviceUrl;
        const src = this.params.url;

        const service = RequestServices.retrieveOrCreate( {
            url: serviceUrl
        }, ServiceType.COMMON );

        const httpParams: AxiosRequestConfig = {
            url: src,
            responseType: 'blob'
        };
        const cancellableRequest = this.createXhr( service.commonGet.bind( service ), undefined, httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: Blob } ) {
        // function ab2str(array) {
        //     const stringKey = '';
        //     for (const i = 0; i < array.length; i++) {
        //         stringKey += String.fromCharCode(array[i]);
        //     }
        //     return btoa(stringKey);
        // }
        // const imageDataUrl = 'data:' + 'image/png' + ';base64,' + ab2str(new Uint8Array(this.response));

        const imageDataUrl = self.URL.createObjectURL( response.data );

        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: {
                imageSrc: imageDataUrl
            }
        };
        this.state = MessageState.received;
    }
}

export type HeightsLoaderParams = {
    options: GetCoverageTileParams;
    src?: string;
}

export type HeightTileBasic = {
    Level: number;
    HeightNumber: number;
    WidthNumber: number;
    Width: number;
    Height: number;
    MaxValue: number;
    MinValue: number;
}

export type HeightTileBasicDescription = {
    Ident: number;
    Reserve: number;
    Width: number;
    Height: number;
    Epsg: number;
    Level: number;
    Col: number;
    Row: number;
    MinValue: number;
    MaxValue: number;
}

export type HeightsPreLoaderParams = {
    options: GetCoverageTilesHeaderParams;
    src?: string;
}

/**
 * Класс предзагрузки тайлов высот
 * @class HeightsPreLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class HeightsPreLoader extends QueueObject<HeightsPreLoaderParams, { heightTileHeadersJSON?: SimpleJson<HeightTileBasic> }> {

    /**
     * Заголовок тайла высот
     * @private
     * @static
     * @property mMtrTileMiniTemplate
     */
    private static mMtrTileMiniTemplate: HeightTileBasicDescription = {
        'Ident': 0,                             // Идентификатор записи (должен быть 0x3F3F3F3F
        'Reserve': 0,                           // Резерв
        'Width': 0,                             // Число столбцов (256)
        'Height': 0,                            // Число строк    (256)
        'Epsg': 0,                              // Код EPSG плановой системы координат (например, 3857)
        'Level': 0,                             // Уровень матрицы в пирамиде матриц (аналогично пирамиде тайлов)
        'Col': 0,                               // Номер столбца матрицы в заданной системе координат (в пространстве от -180 до +180 градусов)
        'Row': 0,                               //  Номер строки матрицы в заданной системе координат (в пространстве от -90 до +90 градусов)
        'MinValue': 0,                          // Минимальное значение в матрице
        'MaxValue': 0                           // Максимальное значение в матрице
    };

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;
        const serviceUrl = this.params.src;
        if ( serviceUrl ) {
            const httpParams: AxiosRequestConfig & { url: string; } = {
                url: serviceUrl
            };
            const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
            const cancellableRequest = this.createXhr( service.getCoverageTilesHeader.bind( service ), this.params.options, httpParams );

            this.mAbortMethod = cancellableRequest.abortXhr;

        } else {
            this.runReceive( { data: new ArrayBuffer( 0 ) } );
        }
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: ArrayBuffer; error?: string; } ) {
        if ( this.checkInProcess() ) {
            this.responseData = {
                command: this.command,
                id: this.id,
                params: this.params,
                data: {
                    heightTileHeadersJSON: this.parseArrayBuffer( response.data ) || this.createDefaultPreloadedTiles()
                }
            };
            this.state = MessageState.received;
        }
    }

    /**
     * Создать заголовок тайла высот
     * @method createMtrTileMini
     * @private
     * @param mtrTileMiniArray {object} Параметры из ответа сервиса
     * @return {object} Заголовок тайла высот
     */
    private static createMtrTileMini( mtrTileMiniArray: Int32Array ) {
        // Обнуляем все значения
        // for ( const k in HeightsPreLoader.mMtrTileMiniTemplate ) {
        //     HeightsPreLoader.mMtrTileMiniTemplate[ k ] = 0;
        // }

        this.mMtrTileMiniTemplate[ 'Ident' ] = mtrTileMiniArray[ 0 ];
        this.mMtrTileMiniTemplate[ 'Reserve' ] = mtrTileMiniArray[ 1 ];
        this.mMtrTileMiniTemplate[ 'Width' ] = mtrTileMiniArray[ 2 ];
        this.mMtrTileMiniTemplate[ 'Height' ] = mtrTileMiniArray[ 3 ];
        this.mMtrTileMiniTemplate[ 'Epsg' ] = mtrTileMiniArray[ 4 ];
        this.mMtrTileMiniTemplate[ 'Level' ] = mtrTileMiniArray[ 5 ];
        this.mMtrTileMiniTemplate[ 'Col' ] = mtrTileMiniArray[ 6 ];
        this.mMtrTileMiniTemplate[ 'Row' ] = mtrTileMiniArray[ 7 ];
        this.mMtrTileMiniTemplate[ 'MinValue' ] = mtrTileMiniArray[ 8 ];
        this.mMtrTileMiniTemplate[ 'MaxValue' ] = mtrTileMiniArray[ 9 ];

        if ( this.mMtrTileMiniTemplate[ 'MinValue' ] === -32767 || this.mMtrTileMiniTemplate[ 'MinValue' ] === -32767000 ) {
            this.mMtrTileMiniTemplate[ 'MinValue' ] = 0;
        }
        if ( this.mMtrTileMiniTemplate[ 'MinValue' ] === 2000000000 && this.mMtrTileMiniTemplate[ 'MaxValue' ] === -2000000000 ) {
            this.mMtrTileMiniTemplate[ 'MinValue' ] = this.mMtrTileMiniTemplate[ 'MaxValue' ] = 0;
        }

        return this.mMtrTileMiniTemplate;
    }

    /**
     * Создать предзагруженные тайлы высот
     * @private
     * @method createDefaultPreloadedTiles
     * @return {SimpleJson<HeightTileBasic> } Коллекция предзагруженных тайлов высот
     */
    private createDefaultPreloadedTiles() {
        const preloadedTiles: SimpleJson<HeightTileBasic> = {};
        const projection = ProjectionCollection[ this.params.options.TILEMATRIXSET ];
        for ( let level = 0; level < 7; level++ ) {
            const pointsBySide = projection.getPointsBySide( level )!;
            const rowCount = projection.getRowCount( level );
            const colCount = projection.getColCount( level );
            for ( let row = 0; row < rowCount; row++ ) {
                for ( let col = 0; col < colCount; col++ ) {
                    const identifier = new TileIdentifier( level, col, row );
                    preloadedTiles[ identifier.toString() ] = {
                        Level: level,
                        HeightNumber: row,
                        WidthNumber: col,
                        Width: pointsBySide,
                        Height: pointsBySide,
                        MaxValue: 300,
                        MinValue: 0
                    };
                }
            }
        }
        return preloadedTiles;
    }

    /**
     * Разобрать ответ сервиса
     * @method parseArrayBuffer
     * @param arrayBuffer {ArrayBuffer} Ответ сервиса
     * @return {SimpleJson<HeightTileBasic>|undefined} Коллекция заголовков тайлов высот
     */
    parseArrayBuffer( arrayBuffer: ArrayBuffer ) {
        let preloadedTiles: SimpleJson<HeightTileBasic> | undefined;
        const preloadedTilesArray: HeightTileBasic[] = [];
        const projection = ProjectionCollection[ this.params.options.TILEMATRIXSET ];
        // Пытаемся прочитать полученный массив высотных данных
        const SIZE_TILE = 10;
        const BYTE_SIZE_TILE = SIZE_TILE * 4;
        const arrayByteLength = arrayBuffer.byteLength;
        let curByteOffset = 0;

        while ( curByteOffset < arrayByteLength ) {
            const tileArray = new Int32Array( arrayBuffer, curByteOffset, SIZE_TILE );
            curByteOffset += BYTE_SIZE_TILE;

            const tileMini = HeightsPreLoader.createMtrTileMini( tileArray );

            if ( tileMini.Ident !== 0x3F3F3F3F ) {
                // Сервер вернул мусор
                preloadedTilesArray.length = 0;
                break;
            }
            const level = tileMini[ 'Level' ];
            const col = tileMini[ 'Col' ];
            const row = tileMini[ 'Row' ];

            const pointsBySide = projection.getPointsBySide( level )!;
            preloadedTilesArray.push( {
                Level: level,
                HeightNumber: row,
                WidthNumber: col,
                Width: pointsBySide,
                Height: pointsBySide,
                MaxValue: tileMini[ 'MaxValue' ],
                MinValue: tileMini[ 'MinValue' ]
            } );
        }

        if ( preloadedTilesArray.length > 0 ) {
            preloadedTiles = {};
            for ( let i = 0; i < preloadedTilesArray.length; i++ ) {
                const tileDescription = preloadedTilesArray[ i ];
                const identifier = new TileIdentifier( tileDescription.Level, tileDescription.WidthNumber,
                    tileDescription.HeightNumber );
                preloadedTiles[ identifier.toString() ] = tileDescription;
            }
        }

        return preloadedTiles;
    }
}

export type HeightTileDescription = {
    Ident: number;
    Length: number;
    Width: number;
    Height: number;
    Epsg: number;
    Level: number;
    WidthNumber: number;
    HeightNumber: number;
    Unit: number;
    UnitPlane: number;
    ItemWidth: number;
    ItemHeight: number;
    MinValue: number;
    MaxValue: number;
    HeightPrecision: number;
}

export type HeightLoaderData = {
    heightTileJSON: HeightTileSerialised;
}

/**
 * Класс загрузки тайлов высот
 * @class HeightsLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class HeightsLoader extends QueueObject<HeightsLoaderParams, HeightLoaderData> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;
        const serviceUrl = this.params.src;
        if ( serviceUrl ) {
            const httpParams: AxiosRequestConfig & { url: string; } = {
                url: serviceUrl
            };
            const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
            const cancellableRequest = this.createXhr( service.getCoverageTile.bind( service ), this.params.options, httpParams );

            this.mAbortMethod = cancellableRequest.abortXhr;
        } else {
            this.runReceive( { data: new ArrayBuffer( 0 ) } );
        }
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: ArrayBuffer; error?: string; } ) {
        if ( this.checkInProcess() ) {

            const parsedTile = HeightsLoader.parseArrayBuffer( response.data );
            let hTile;
            if ( parsedTile !== undefined ) {
                const projection = ProjectionCollection[ this.params.options.TILEMATRIXSET ];
                const description = parsedTile[ 0 ];
                HeightsLoader.toUint8Array( parsedTile[ 1 ], description );
                hTile = new HeightTile( projection, description );
                hTile.setHeights( parsedTile[ 1 ] );
                hTile.prepareMesh();
            } else {
                const options = this.params.options;
                const level = +options.TILEMATRIX;
                const col = +options.TILECOL;
                const row = +options.TILEROW;
                hTile = this.prepareDefaultTile( level, row, col );
            }

            this.responseData = {
                command: this.command,
                id: this.id,
                params: this.params,
                data: { heightTileJSON: hTile.toJSON() }
            };
            this.state = MessageState.received;
        }
    }

    /**
     * Создать стандартный тайл высот
     * @private
     * @method prepareDefaultTile
     * @param level {number} Уровень тайла
     * @param row {number} Номер строки тайла
     * @param col {number} Номер столбца тайла
     * @return {HeightTile} Тайл высот
     */
    private prepareDefaultTile( level: number, row: number, col: number ) {
        const projection = ProjectionCollection[ this.params.options.TILEMATRIXSET ];
        const pointsBySide = projection.getPointsBySide( level )!;
        const hTile = new HeightTile( projection, {
            Level: level,
            HeightNumber: row,
            WidthNumber: col,
            Width: pointsBySide,
            Height: pointsBySide,
            MaxValue: 300,
            MinValue: 0,
            Ident: 0,
            Length: 0,
            Epsg: 0,
            Unit: 0,
            UnitPlane: 0,
            ItemWidth: 0,
            ItemHeight: 0,
            HeightPrecision: 0
        } );
        hTile.prepareMesh();
        return hTile;
    }

    /**
     * Разобрать ответ сервиса
     * @private
     * @static
     * @method parseArrayBuffer
     * @param arrayBuffer {ArrayBuffer} Ответ сервиса
     * @return {[HeightTileDescription, number[]] |undefined} Параметры тайла высот [заголовок,массив высот]
     */
    private static parseArrayBuffer( arrayBuffer: ArrayBuffer ): [HeightTileDescription, number[]] | undefined {
        if ( arrayBuffer.byteLength === 0 ) {
            return;
        }
        // Пытаемся прочитать полученный массив высотных данных
        const SIZE_TILE_HEAD = 16;
        const BYTE_SIZE_TILE_HEAD = SIZE_TILE_HEAD * 4;
        const headArray: Int32Array = new Int32Array( arrayBuffer, 0, SIZE_TILE_HEAD );
        const headMtrTile = HeightsLoader.createHeadMtrTile( headArray );
        if ( headMtrTile.Ident !== 0x7F7F7F7F ) {
            // Сервер вернул мусор
            return;
        }
        // Определить ошибку:
        if ( headMtrTile.MinValue === 2000000000 && headMtrTile.MaxValue === -2000000000 ) {
            headMtrTile.MinValue = headMtrTile.MaxValue = 0;
        }
        // Коэффициент преобразования полученных высот из заданных единиц измерения (headMtrTile.Unit) в метры
        const kHeight = Math.pow( 10.0, -(headMtrTile.Unit) );
        // Количество элементов тайла
        const nElem = headMtrTile.Height * headMtrTile.Width;
        // Размерность получаемый высот в байтах:
        // 8 - абсолютные 8-ми байтовые,4 - абсолютные 4-х байтовые, 2,1 - относительные (относительно MinHeight) 2-х байтовые 1 байтовые
        const dimension = headMtrTile.HeightPrecision;
        // Формируем массив для забора высот из тайла в зависимости от размерности получаемых высот
        let heightsArray;
        try {
            switch ( dimension ) {
                case 8:
                    heightsArray = new Float64Array( arrayBuffer, BYTE_SIZE_TILE_HEAD, nElem );
                    break;
                case 4:
                    heightsArray = new Int32Array( arrayBuffer, BYTE_SIZE_TILE_HEAD, nElem );
                    break;
                case 2:
                    heightsArray = new Uint16Array(arrayBuffer, BYTE_SIZE_TILE_HEAD, nElem);
                    break;
                case 1:
                    heightsArray = new Uint8Array(arrayBuffer, BYTE_SIZE_TILE_HEAD, nElem);
                    break;
                default:
                    heightsArray = new Uint8Array(nElem);
            }
        } catch (error) {
            heightsArray = new Uint8Array(nElem);
        }
        // Запросить минимальную и максимальную высоты тайла
        headMtrTile.MinValue *= kHeight;
        headMtrTile.MaxValue *= kHeight;
        // Записать высоты в общий массив
        const heights: number[] = [];
        const length = heightsArray.length;
        for ( let i = 0; i < length; i++ ) {
            // Заполняем массив высот тайла в зависимости от размерности полученных высот
            let currentHeight = kHeight * heightsArray[ i ];
            if ( dimension === 2 || dimension === 1 ) {
                currentHeight += headMtrTile.MinValue;
            }

            // Вместо ошибочных высот выставляем минимальную
            if ( currentHeight > 8848 ) {
                currentHeight = 0;
            }
            if ( currentHeight < -11022 ) {
                currentHeight = 0;
            }
            heights[ i ] = currentHeight;
        }
        if ( headMtrTile.MinValue === -32767 || headMtrTile.MinValue === -32767000 ) {
            headMtrTile.MinValue = 0;
        }
        return [headMtrTile, heights];
    }

    /**
     * Создать заголовок тайла высот
     * @private
     * @static
     * @method createHeadMtrTile
     * @param mtrTileArray {Int32Array} Параметры из ответа сервиса
     * @return {HeightTileDescription} Заголовок тайла высот
     */
    private static createHeadMtrTile( mtrTileArray: Int32Array ): HeightTileDescription {
        return {
            'Ident': mtrTileArray[ 0 ],             // Идентификатор записи 0x7F7F7F7F
            'Length': mtrTileArray[ 1 ],            // Длина записи в байтах с заголовком (262208 байт)
            'Width': mtrTileArray[ 2 ],             // Число столбцов (256)
            'Height': mtrTileArray[ 3 ],            // Число строк    (256)
            'Epsg': mtrTileArray[ 4 ],              // Код EPSG плановой системы координат (например, 3857)
            'Level': mtrTileArray[ 5 ],             // Уровень матрицы в пирамиде матриц (аналогично пирамиде тайлов)
            'WidthNumber': mtrTileArray[ 6 ],       // Номер столбца матрицы в заданной системе координат (в пространстве от -180 до +180 градусов)
            'HeightNumber': mtrTileArray[ 7 ],      // Номер строки матрицы в заданной системе координат (в пространстве от -90 до +90 градусов)
            'Unit': mtrTileArray[ 8 ],              // Единица измерения высоты (0 - метры, 1 - дециметры, 2 - сантиметры, 3 - миллиметры)
            'UnitPlane': mtrTileArray[ 9 ],         // Единица измерения в плане (0 - метры, 1 - дециметры, 2 - сантиметры, 3 - миллиметры)
            'ItemWidth': mtrTileArray[ 10 ],        // Ширина элемента в заданных единицах измерения в плане (справочно)
            'ItemHeight': mtrTileArray[ 11 ],       // Высота элемента в заданных единицах измерения в плане (справочно)
            'MinValue': mtrTileArray[ 12 ],         // Минимальное значение в матрице
            'MaxValue': mtrTileArray[ 13 ],         // Максимальное значение в матрице
            'HeightPrecision': mtrTileArray[ 14 ]          // Точность высот 8 - double 4 - int 2 -short int 1 - char
        };
    }

    /**
     * Приведение высот к байтовому массиву
     * @private
     * @static
     * @method toUint8Array
     * @param heights {number[]} Массив высот
     * @param description {HeightTileDescription} Заголовок тайла высот
     */
    private static toUint8Array( heights: number[], description: HeightTileDescription ) {
        let deltaHeightUnit;
        const minValue = description.MinValue;
        if ( description.MaxValue - minValue === 0 ) {
            deltaHeightUnit = 0;
        } else {
            deltaHeightUnit = 255 / (description.MaxValue - minValue);
        }
        for ( let i = 0; i < heights.length; i++ ) {
            heights[ i ] = Math.round( (heights[ i ] - minValue) * deltaHeightUnit );
        }
    }
}

export type HeightsCreatorParams = HeightsLoaderParams & {
    hTile: HeightTileSerialised;
}

/**
 * Класс создания тайлов высот
 * @class HeightsCreator
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class HeightsCreator extends QueueObject<HeightsCreatorParams, HeightLoaderData> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {

        this.state = MessageState.inProcess;
        const projection = ProjectionCollection[ this.params.options.TILEMATRIXSET ];
        const parentTile = new HeightTile( projection );
        parentTile.fromJSON( this.params.hTile );

        const identifier = new TileIdentifier( +this.params.options.TILEMATRIX, +this.params.options.TILECOL, +this.params.options.TILEROW );

        const hTile = parentTile.createHeightChildTile( identifier );

        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: { heightTileJSON: hTile.toJSON() }
        };

        this.state = MessageState.received;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param hTile {HeightTile} Тайл высот
     */
    runReceive( hTile: HeightTile ) {

    }
}

/**
 * Класс загрузки метаданных 3D модели
 * @class Tiles3dMetadata
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class Tiles3dMetadata extends QueueObject<{ src: string; layerId: string; }, {
    metadata?: Metadata,
    errorText?: string;
}> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;
        const serviceUrl = this.params.src;
        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const cancellableRequest = this.createXhr( service.get3dMetadata.bind( service ), { LAYER: this.params.layerId }, httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @async
     * @method runReceive
     * @param response {object} Ответ
     */
    async runReceive( response: { data: ArrayBuffer; error: string; } ) {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }
        const metadata = ParserTiles3d.read3dMetadata( response.data );
        let errorText = '';
        if ( metadata === undefined ) {
            const textResponse = await Utils.readBlobAsText( new Blob( [new Uint8Array( response.data )] ) );
            try {
                Utils.checkXMLException(textResponse);
            } catch (error) {
                const gwtkError = new GwtkError(error);
                errorText = JSON.parse(gwtkError.message).exceptionText;
            }
        }
        this.responseData = {
            data: { metadata, errorText },
            command: this.command,
            id: this.id,
            params: this.params
        };
        this.state = MessageState.received;
    }
}


export type Tiles3dLoaderParams = { src: string; serviceVersion: number; obb: OrientedBoundingBox3D['json']; tilematrixset: string; crs: CrsType; jsRpc: Get3dTilesParams };

type Tile3dList = { [ key: string ]: { items: { [ key: string ]: ModelItem } } };
type ModelItem = { items: { [ key: string ]: ModelPrimitive3d } };

type Tile3dListSerialized = { [ key: string ]: { items: ModelItemsSerialized } };
type ModelItemsSerialized = { [ key: string ]: { items: { [ key: string ]: ModelPrimitive3dSerialized } } };

/**
 * Класс загрузки тайлов 3D модели
 * @class Tiles3dLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class Tiles3dLoader extends QueueObject<Tiles3dLoaderParams, { tileMeshes: { obb?: OrientedBoundingBox3D['json'], tileList: Tile3dListSerialized }[]; }> {

    /**
     * Объект для ответа в случае ошибки
     * @property ErrorObject
     */
    ErrorObject = { tileMeshes: Tiles3dLoader.mEmptyMeshList };

    /**
     * Вспомогательный массив мешей
     * @private
     * @static
     * @property mEmptyMeshList
     */
    private static mEmptyMeshList: { obb: OrientedBoundingBox3D['json'], tileList: Tile3dListSerialized }[] = [];
    /**
     * Вспомогательный массив
     * @private
     * @static
     * @property mSupport
     */
    private static mSupport: [number[], Vector3D, Vector3D, Vector3D, Vector3D, Vector3D[]] = [[], vec3.create(), vec3.create(), vec3.create(), vec3.create(), []];

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;

        const serviceUrl = this.params.src;
        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const cancellableRequest = this.createXhr( service.get3dTiles.bind( service ), this.params.jsRpc, httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: ArrayBuffer; error: string; } ): void {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }

        const parsedTile = ParserTiles3d.readTiles3D( response.data, this.params.serviceVersion );
        const answerList: { obb?: OrientedBoundingBox3D['json'] | undefined; tileList: Tile3dListSerialized; }[] = [];
        for ( let i = 0; i < parsedTile.length; i++ ) {
            answerList.push( this.parseStructure( parsedTile[ i ] ) );
        }

        this.responseData = {
            data: { tileMeshes: answerList },
            command: this.command,
            id: this.id,
            params: this.params
        };

        this.state = MessageState.received;
    }

    /**
     * Разобрать структуру
     * @private
     * @method parseStructure
     * @param structure {object} Структура
     */
    private parseStructure( structure: Tile3D ): { obb?: OrientedBoundingBox3D['json']; tileList: Tile3dListSerialized } {
        const tileListSerialized: Tile3dListSerialized = {};
        let obb;
        if ( structure != null ) {
            const tileList: Tile3dList = {};
            const tileDescriptionList = structure.TileList;
            if ( Array.isArray( tileDescriptionList ) ) {
                for ( let tile, i = 0; (tile = tileDescriptionList[ i ]); i++ ) {
                    const tileId = tile.Zoom + '_' + tile.Col + '_' + tile.Row;
                    if ( tileList[ tileId ] === undefined ) {
                        tileList[ tileId ] = { items: {} };
                    }
                }
            }
            const modelList: Model[] = structure.ModelList;
            const positionsTile = Tiles3dLoader.mSupport[ 5 ];
            positionsTile.length = 0;
            if ( Array.isArray( modelList ) ) {
                const tileParams = {
                    Row: 0,
                    Col: 0,
                    Zoom: 0
                };
                const projection = ProjectionCollection[ this.params.tilematrixset ];
                for ( let modelParams: Model, i = 0; (modelParams = modelList[ i ]); i++ ) {
                    const primitiveList = modelParams.PrimitiveList;
                    if ( Array.isArray( primitiveList ) ) {

                        for ( let j = 0, primitiveParams: Primitive; (primitiveParams = primitiveList[ j ]); j++ ) {

                            tileParams.Row = primitiveParams.Row;
                            tileParams.Col = primitiveParams.Col;
                            tileParams.Zoom = primitiveParams.Zoom;
                            const tile = tileList[ tileParams.Zoom + '_' + tileParams.Col + '_' + tileParams.Row ];
                            if ( tile != null ) {
                                let existModel: ModelItem = tile.items[ modelParams.Id ];
                                if ( !existModel ) {
                                    existModel = tile.items[ modelParams.Id ] = { items: {} };
                                }

                                const primitive = new ModelPrimitive3d( primitiveParams );

                                if ( primitiveParams.FUNCTIONLIST ) {
                                    if ( primitiveParams.FUNCTIONLIST.TextureId !== undefined && primitiveParams.FUNCTIONLIST.TextureId !== 0 ) {
                                        const texId = primitiveParams.FUNCTIONLIST.TextureId;
                                        const textureId = new TextureIdentifier( primitive.tilematrix, texId ).toString();
                                        primitive.setTextureId( textureId );
                                    } else if ( primitiveParams.FUNCTIONLIST.MaterialId != null ) {
                                        const matId = primitiveParams.FUNCTIONLIST.MaterialId;
                                        const materialId = new MaterialIdentifier( primitive.tilematrix, matId ).toString();
                                        primitive.setMaterialId( materialId );
                                    }
                                }

                                existModel.items[ primitive.id ] = primitive;

                                // recalculate positions
                                const positions = primitive.meshPositions;

                                const topLeft = projection.getTopLeft();
                                const tileWidthMtr = projection.getTileWidthMtr( tileParams.Zoom );
                                const tileHeightMtr = projection.getTileHeightMtr( tileParams.Zoom );

                                const planeMapLeft = topLeft.y + tileWidthMtr * tileParams.Col;
                                const planeMapBottom = topLeft.x - tileHeightMtr * (tileParams.Row + 1);
                                const tilePointYX = Tiles3dLoader.mSupport[ 1 ] as Vector3D;
                                tilePointYX.length = 3;
                                tilePointYX[ 0 ] = planeMapBottom;
                                tilePointYX[ 1 ] = planeMapLeft;
                                tilePointYX[ 2 ] = 0;

                                for ( let ii = 0; ii < positions.length; ii++ ) {
                                    const curPosXYZ = this.calcPoint( positions[ ii ], tilePointYX );
                                    positionsTile.push( curPosXYZ );
                                }
                            }
                        }
                    }
                }
                if ( positionsTile.length > 0 ) {
                    const obbItem = new OrientedBoundingBox3D();
                    obbItem.fromJSON( this.params.obb );
                    const positions = obbItem.getPositions();
                    for ( let ii = 0; ii < positions.length; ii++ ) {
                        positionsTile.push( positions[ ii ].slice() as Vector3D );
                    }
                    obbItem.fitPoints( positionsTile );
                    const centerPoint = obbItem.getCenter();
                    for ( let ii = 0; ii < positionsTile.length; ii++ ) {
                        vec3.sub( positionsTile[ ii ], centerPoint );
                    }
                    obb = obbItem.toJSON();

                    if ( this.params.crs === projection.getCRS() ) {
                        // recalculate normals
                        const geoPoint = projection.getGlobeShape().toGeodetic3d( centerPoint );

                        const newX = vec3.rotateZ( vec3.UNITX, geoPoint.getLongitude(), Tiles3dLoader.mSupport[ 1 ] );
                        const newY = vec3.rotateZ( vec3.UNITY, geoPoint.getLongitude(), Tiles3dLoader.mSupport[ 2 ] );

                        const newZ = vec3.rotateAroundAxis( vec3.UNITZ, newY, Math.PI * 0.5 - geoPoint.getLatitude(), Tiles3dLoader.mSupport[ 3 ] );
                        vec3.rotateAroundAxis( newX, newY, Math.PI * 0.5 - geoPoint.getLatitude() );
                        vec3.rotateAroundAxis( newX, newZ, Math.PI * 0.5 );
                        vec3.rotateAroundAxis( newY, newZ, Math.PI * 0.5 );

                        const curVec = Tiles3dLoader.mSupport[ 4 ];

                        for ( const k in tileList ) {
                            const tileItems = tileList[ k ].items;
                            for ( const kk in tileItems ) {
                                const tilePrimitives = tileItems[ kk ].items;
                                for ( const kkk in tilePrimitives ) {
                                    const tilePrimitive = tilePrimitives[ kkk ];
                                    if ( tilePrimitive.meshData ) {
                                        const normals = tilePrimitive.meshData.getAttributes()[ 'aVertexNormal' ].getValues();
                                        for ( let ii = 0; ii < normals.length; ii++ ) {
                                            const curNormal = normals[ ii ];

                                            if ( Array.isArray( curNormal ) ) {
                                                const normal = vec3.create();
                                                if ( curNormal.length === 3 ) {
                                                    vec3.set( curNormal, normal );
                                                } else if ( curNormal.length === 4 ) {
                                                    vec3.fromVector4( curNormal, normal );
                                                } else {
                                                    continue;
                                                }
                                                vec3.normalize( normal );
                                                const xProjection = normal[ 0 ];
                                                const yProjection = normal[ 1 ];
                                                const zProjection = normal[ 2 ];

                                                vec3.set( vec3.ZERO, normal );

                                                vec3.add( normal, vec3.scale( newX, xProjection, curVec ) );
                                                vec3.add( normal, vec3.scale( newY, yProjection, curVec ) );
                                                vec3.add( normal, vec3.scale( newZ, zProjection, curVec ) );

                                                vec3.normalize( normal );
                                                normals[ ii ] = normal;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //длина общего буфера для передачи в основной поток
                    let byteLength = 0;
                    for ( const k in tileList ) {
                        const tileItems = tileList[ k ].items;
                        for ( const kk in tileItems ) {
                            const tilePrimitives = tileItems[ kk ].items;
                            for ( const kkk in tilePrimitives ) {
                                const primitive = tilePrimitives[ kkk ];
                                const mesh = primitive.meshData;
                                if ( mesh ) {
                                    byteLength += mesh.getBufferParams().byteLength;
                                }
                            }
                        }
                    }
                    const arrayBufferObject = {
                        arrayBuffer: new ArrayBuffer( byteLength ),
                        currentByteOffset: 0
                    };
                    // сериализация для передачи в основной поток
                    for ( const k in tileList ) {
                        const tileItems = tileList[ k ].items;
                        const tileItemsSerialized: ModelItemsSerialized = {};
                        for ( const kk in tileItems ) {
                            const tilePrimitives = tileItems[ kk ].items;
                            const tilePrimitivesSerialized: { [ key: string ]: ModelPrimitive3dSerialized } = {};
                            for ( const kkk in tilePrimitives ) {
                                // const primitive = tilePrimitives[ kkk ];
                                // const mesh = primitive.meshData;
                                // tilePrimitives[ kkk ] = primitive.toJSON( arrayBufferObject );

                                tilePrimitivesSerialized[ kkk ] = tilePrimitives[ kkk ].toJSON( arrayBufferObject );
                            }
                            tileItemsSerialized[ kk ] = { items: tilePrimitivesSerialized };
                        }
                        tileListSerialized[ k ] = { items: tileItemsSerialized };
                    }
                }
            }
        }
        return { tileList: tileListSerialized, obb };
    }

    /**
     * Посчитать координату точки
     * @private
     * @method calcPoint
     * @param curPos{Vector3D} Координаты вершины меша
     * @param tilePointYX{Vector3D} Прямоугольные координаты левого нижнего угла тайла
     * @return {Vector3D} Геоцентрические координаты вершины [X,Y,Z]
     */
    private calcPoint( curPos: Vector3D, tilePointYX: Vector3D ) {
        let curPosXYZ;
        const projection = ProjectionCollection[ this.params.tilematrixset ];
        if ( this.params.crs === projection.getCRS() ) {
            const supPos = Tiles3dLoader.mSupport[ 2 ];
            supPos[ 0 ] = curPos[ 1 ];
            supPos[ 1 ] = curPos[ 0 ];
            supPos[ 2 ] = curPos[ 2 ];
            vec3.add( supPos, tilePointYX );
            const curPosGeo = projection.xy2geo( supPos[ 0 ], supPos[ 1 ], supPos[ 2 ] );
            curPosXYZ = projection.getGlobeShape().toVector3d( curPosGeo, curPos );
        } else if ( this.params.crs === CrsType.EPSG_4326 || this.params.crs === CrsType.GEOCENTRIC ) {//TODO: удалить GEOCENTRIC
            const tilePointGeo = projection.xy2geo( tilePointYX[ 0 ], tilePointYX[ 1 ], tilePointYX[ 2 ] );
            const tilePointXYZ = projection.getGlobeShape().toVector3d( tilePointGeo );

            vec3.add( curPos, tilePointXYZ );
            curPosXYZ = curPos;
        } else {
            curPosXYZ = curPos;
        }
        return curPosXYZ;
    }
}


export type Tiles3dTexturesLoaderParams = { src: string; jsRpc: Get3dTexturesParams; }
export type Tiles3dTexturesLoaderData = { textures?: { Zoom: number; TextureList: Desc3dTexture[] } }

/**
 * Класс загрузки текстур 3D модели
 * @class Tiles3dTexturesLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class Tiles3dTexturesLoader extends QueueObject<Tiles3dTexturesLoaderParams, Tiles3dTexturesLoaderData> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;

        const serviceUrl = this.params.src;

        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const cancellableRequest = this.createXhr( service.get3dTextures.bind( service ), this.params.jsRpc, httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;

    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: ArrayBuffer; error: string; } ): void {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }

        const textures = ParserTiles3d.read3dTextures( response.data );

        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: {
                textures
            }
        };
        this.state = MessageState.received;
    }
}

export type Tiles3dMaterialsLoaderParams = { src: string; jsRpc: Get3dMaterialsParams; }
type MaterialUnit = {
    Id: Desc3dMaterial['Id'];
    Material: {
        AmbientColor: Vector4D;
        DiffuseColor: Vector4D;
        SpecularColor: Vector4D;
        EmissiveColor: Vector4D;
    };
}
export type Tiles3dMaterialsLoaderData = { materials?: { Zoom: number; MaterialList: MaterialUnit[] } }

/**
 * Класс загрузки материалов 3D модели
 * @class Tiles3dMaterialsLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class Tiles3dMaterialsLoader extends QueueObject<Tiles3dMaterialsLoaderParams, Tiles3dMaterialsLoaderData> {

    /**
     * Вспомогательный массив
     * @static
     * @property mEmptyArray
     */
    static mEmptyArray: [];

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;

        const serviceUrl = this.params.src;
        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl,
            responseType: 'arraybuffer'
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const cancellableRequest = this.createXhr( service.get3dMaterials.bind( service ), this.params.jsRpc, httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: ArrayBuffer; error: string; } ) {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }

        const result = ParserTiles3d.read3dMaterials( response.data );

        const materials = result ? Tiles3dMaterialsLoader.calcMaterials( result ) : undefined;

        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: {
                materials
            }
        };


        this.state = MessageState.received;
    }

    /**
     * Обработка описания материалов
     * @private
     * @method calcMaterials
     * @param structure {object} Описание материалов
     * @return {object} Готовое описание
     */
    private static calcMaterials( structure: { Zoom: number, MaterialList: Desc3dMaterial[] } ) {
        if ( structure == null ) {
            return;
        }
        const Zoom = structure.Zoom;
        const MaterialList: MaterialUnit[] = [];
        const materialList = structure.MaterialList;
        if ( Array.isArray( materialList ) ) {
            for ( let i = 0, material; (material = materialList[ i ]); i++ ) {
                const Id = material.Id;
                if ( material.ColorFlag === 1 ) {
                    material.Material.AmbientColor.R = material.Color.R;
                    material.Material.AmbientColor.G = material.Color.G;
                    material.Material.AmbientColor.B = material.Color.B;
                    material.Material.AmbientColor.A = material.Color.A;

                    material.Material.DiffuseColor.R = material.Color.R * 0.75;
                    material.Material.DiffuseColor.G = material.Color.G * 0.75;
                    material.Material.DiffuseColor.B = material.Color.B * 0.75;
                    material.Material.AmbientColor.A = material.Color.A;

                }
                material.Material.AmbientColor.A = Math.max(
                    material.Material.AmbientColor.A,
                    material.Material.DiffuseColor.A,
                    material.Material.SpecularColor.A,
                    material.Material.EmissiveColor.A
                );

                MaterialList.push(
                    {
                        Id,
                        Material: {
                            AmbientColor: Tiles3dMaterialsLoader.getColor( material.Material.AmbientColor ),
                            DiffuseColor: Tiles3dMaterialsLoader.getColor( material.Material.DiffuseColor ),
                            SpecularColor: Tiles3dMaterialsLoader.getColor( material.Material.SpecularColor ),
                            EmissiveColor: Tiles3dMaterialsLoader.getColor( material.Material.EmissiveColor )
                        }
                    }
                );

            }
        }
        return { Zoom, MaterialList };

    }

    /** Функция получение цвета в виде массива
     * @private
     * @static
     * @method getColor
     * @param colorObj {IMG3DRGBA} Цвет ({R,G,B,A})
     * @result {Vector4D} Массив каналов цвета ([R,G,B,A]);
     */
    private static getColor( colorObj: IMG3DRGBA ): Vector4D {
        return [
            Math.floor( colorObj.R * 255 ) / 255,
            Math.floor( colorObj.G * 255 ) / 255,
            Math.floor( colorObj.B * 255 ) / 255,
            Math.floor( colorObj.A * 255 ) / 255];
    }
}


export type WFSLoaderParams = {
    tilematrixset: string;
    level: number;
    layerId: string;
    src: string;
    instancedMeshList: string;
    jsRpc: GetFeatureParams;
    hTile: HeightTileSerialised;
    cutByFrame: 0 | 1;
}

export type WFSLoaderData = {
    objectMeshList: FeatureMeshCollection[][];
    obb?: BoundingVolume3DSerialized;
    tiledModelList: string[];
};

/**
 * Класс загрузки объектов карты
 * @class WFSLoader
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class WFSLoader extends QueueObject<WFSLoaderParams, WFSLoaderData> {

    /**
     * Объект для ответа в случае ошибки
     * @property ErrorObject
     */
    ErrorObject = { objectMeshList: WFSLoader.mEmptyAnswer, tiledModelList: WFSLoader.mEmptyAnswer };

    /**
     * Полученные данные
     * @private
     * @property receivedData
     */
    private receivedData: string | undefined;

    /**
     * Пустой ответ
     * @static
     * @property mEmptyArray
     */
    static mEmptyAnswer = [];

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;

        const serviceUrl = this.params.src;
        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const cancellableRequest = this.createXhr( service.getFeature.bind( service ), [this.params.jsRpc], httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: string; error: string; } ): void {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend || this.state === MessageState.received ) {
            return;
        }
        this.receivedData = response.data || undefined;
        this.state = MessageState.received;
    }

    /**
     * Запуск процессса после обработки ответа
     * @method runPostReceive
     */
    runPostReceive() {
        const response = this.receivedData;
        const projection = ProjectionCollection[ this.params.tilematrixset ];
        const heightTile = new HeightTile( projection );
        heightTile.fromJSON( this.params.hTile );
        const objectMeshList: FeatureMeshCollection[][] = [];
        const tiledModelList: string[] = [];
        const responseBufferList: ArrayBufferLike[] = [];
        if ( response !== undefined ) {

            const instancedMeshList = this.params.instancedMeshList.split( ',' );
            const projection = ProjectionCollection[ this.params.tilematrixset ];
            const geoJSON = new GeoJSON( response );
            for ( let j = 0, feature; (feature = geoJSON.featureCollection.getFeature( j )); j++ ) {
                const scale = projection.getScaleByLevel( this.params.level )!;
                if ( feature.properties[ 'topscale' ] === 40000000 ) {
                    feature.properties[ 'topscale' ] = Number.MAX_VALUE;// Для максимального значения увеличиваем
                }
                if ( (feature.properties[ 'bottomscale' ] && feature.properties[ 'bottomscale' ] > scale) || (feature.properties[ 'topscale' ] && scale > feature.properties[ 'topscale' ]) ) {
                    continue;
                }

                const layerId = this.params.serviceUrl + this.params.layerId;
                const desc = Object3dCreator.getDescription( layerId, feature.properties.code!, feature.properties.key + '', this.params.cutByFrame );
                if ( !desc ) {
                    continue;
                }
                const viewtype = +desc.viewtype;
                const local = +desc.local;

                let SEM3DVIEWFILE;
                if ( feature.properties[ 'SEM3DVIEWFILE' ] ) {
                    SEM3DVIEWFILE = feature.properties[ 'SEM3DVIEWFILE' ];
                } else if ( feature.properties.semantics ) {
                    const semantic3d = feature.properties.semantics.find( item => item.code === '32771' || item.key === 'SEM3DVIEWFILE' );
                    if ( semantic3d ) {
                        SEM3DVIEWFILE = semantic3d.value;
                    }
                }

                if ( SEM3DVIEWFILE ) {
                    tiledModelList.push( SEM3DVIEWFILE );
                    continue;
                }

                let color, height: IMG3DVALUE | undefined = undefined;
                if ( viewtype !== VIEWTYPE.Template ) {
                    // Переопределение шаблона высоты
                    const heightDesc = desc.height;
                    if ( heightDesc ) {
                        const Value = +heightDesc.heightDef;
                        const Factor = heightDesc.heightSem !== undefined ? +heightDesc.heightSem : 1;
                        const Offset = heightDesc.heightConstSem !== undefined ? +heightDesc.heightConstSem : 0;
                        const Type = heightDesc.keySem !== '' ? 1 : 0;
                        const SemKey = heightDesc.keySem;
                        height = { Value, Factor, Offset, Type, SemKey };
                    }

                    if ( desc.colorValue != null ) {
                        color = desc.colorValue;
                    }
                }

                const options: TemplateOptions = {
                    viewtype,
                    local,
                    color,
                    height
                };

                const object3dMeshCollection = Object3dCreator.createMesh( feature, options, heightTile, layerId );
                if ( object3dMeshCollection !== undefined ) {
                    const featureMeshCollectionList: FeatureMeshCollection[] = [];
                    for ( const minDistance in object3dMeshCollection.meshList ) {
                        const featureMeshList = object3dMeshCollection.meshList[ +minDistance ];
                        const features: FeatureMesh[] = [];
                        for ( let i = 0; i < featureMeshList.length; i++ ) {
                            const featureMesh = featureMeshList[ i ];
                            if ( featureMesh.description && instancedMeshList.indexOf( featureMesh.description.guid ) !== -1 ) {
                                featureMesh.mesh = undefined;
                            }
                            if ( featureMesh.mesh && featureMesh.mesh.bufferArray ) {
                                responseBufferList.push( featureMesh.mesh.bufferArray );
                            }
                            if ( featureMesh.meshText && featureMesh.meshText.bufferArray ) {
                                responseBufferList.push( featureMesh.meshText.bufferArray );
                            }
                            if ( featureMesh.meshInstanced && featureMesh.meshInstanced.bufferArray ) {
                                responseBufferList.push( featureMesh.meshInstanced.bufferArray );
                            }
                            features.push( featureMesh );
                        }
                        const featureMeshCollection = { features, minDistance: +minDistance };
                        featureMeshCollectionList.push( featureMeshCollection );
                    }
                    objectMeshList.push( featureMeshCollectionList );
                }
            }
        }

        // const resultData = {geoJSON: JSON.stringify(response)};
        const obb = heightTile && heightTile.getOBB()?.toJSON() || undefined;

        this.responseData = {
            data: { objectMeshList, obb, tiledModelList },
            command: this.command,
            id: this.id,
            params: this.params
        };

        if ( responseBufferList.length > 0 ) {
            this.responseBufferList = responseBufferList;
        }

        this.state = MessageState.done;
        // }
    }
}


export type ServiceObjectsCreatorParams = {
    geoJSON: string;
    tilematrixset: string;
    hTile?: HeightTileSerialised;
    obb: BoundingVolume3DSerialized;
    layerId?: string;
}

export type ServiceObjectsCreatorData = {
    objectMeshList: FeatureMeshCollection[][];
    obb?: BoundingVolume3DSerialized;
};

/**
 * Класс создания сервисных объектов карты
 * @class ServiceObjectsCreator
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class ServiceObjectsCreator extends QueueObject<ServiceObjectsCreatorParams, ServiceObjectsCreatorData> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;
        const objectMeshList: FeatureMeshCollection[][] = [];
        let obbJSON;
        if ( this.params.geoJSON != null ) {
            const geoJSON = new GeoJSON( this.params.geoJSON );
            const projection = ProjectionCollection[ this.params.tilematrixset ];

            const heightTile = new HeightTile( projection );

            if ( this.params.hTile ) {
                heightTile.fromJSON( this.params.hTile );

                obbJSON = heightTile.getOBB()?.toJSON();
            } else if ( this.params.obb ) {
                obbJSON = this.params.obb;
                const obb = new BoundingSphere3D();
                obb.fromJSON( obbJSON );
                heightTile.setOBB( obb );
            } else {
                const obb = new BoundingSphere3D();
                heightTile.setOBB( obb );
                obbJSON = obb.toJSON();
            }
            for ( let j = 0, feature; (feature = geoJSON.featureCollection.getFeature( j )); j++ ) {

                const viewtype = feature.properties[ 'viewtype' ]!;
                let local;
                const featureLocal = feature.properties[ 'local' ];
                if ( featureLocal === undefined || featureLocal === -1 ) {
                    local = 0;
                } else {
                    local = featureLocal;
                }
                // Переопределение шаблона высоты
                const heightProps = feature.properties[ 'height' ];
                let height: IMG3DVALUE | undefined;
                if ( heightProps ) {
                    height = {
                        'Value': heightProps[ 'heightDef' ],
                        'Factor': heightProps[ 'heightSem' ] || 1,
                        'Offset': heightProps[ 'heightConstSem' ] || 0,
                        'Type': 0
                    };
                    if ( heightProps[ 'keySem' ] !== '' ) {
                        height[ 'Type' ] = 1;
                        height[ 'SemKey' ] = heightProps[ 'keySem' ];
                    }
                }
                let color;
                if ( feature.properties[ 'colorValue' ] != null ) {
                    color = feature.properties[ 'colorValue' ];
                }

                const options = { viewtype, local, height, color };

                const object3dMeshCollection = Object3dCreator.createMesh( feature, options, heightTile, this.params.layerId || undefined );
                if ( object3dMeshCollection !== undefined ) {
                    const featureMeshCollectionList: FeatureMeshCollection[] = [];
                    for ( const minDistance in object3dMeshCollection.meshList ) {
                        const featureMeshList = object3dMeshCollection.meshList[ minDistance ];
                        const featureMeshCollection: FeatureMeshCollection = {
                            features: [],
                            minDistance: +minDistance
                        };
                        for ( let i = 0; i < featureMeshList.length; i++ ) {
                            const featureMesh: FeatureMesh = featureMeshList[ i ];
                            featureMeshCollection.features.push( featureMesh );
                        }
                        featureMeshCollectionList.push( featureMeshCollection );
                    }
                    objectMeshList.push( featureMeshCollectionList );
                }
            }


        }

        this.runReceive( { objectMeshList, obb: obbJSON } );
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: ServiceObjectsCreatorData ): void {

        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: response
        };

        this.state = MessageState.received;
    }
}


export type UntiledObjectsCreatorParams = {
    geoJSON: string;
    tilematrixset: string;
    untiled?: boolean;
    hTile: HeightTileSerialised;
    layerId?: string;
}

/**
 * Класс создания сервисных объектов карты
 * @class UntiledObjectsCreator
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class UntiledObjectsCreator extends QueueObject<UntiledObjectsCreatorParams, ServiceObjectsCreatorData> { // TODO: untiled

    /**
     * Вспомогательный массив точек
     * @property mPositions
     */
    mPositions = [];

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;
        const objectMeshList = [];
        let obbJSON;
        if ( this.params.geoJSON != null ) {
            const geoJSON = new GeoJSON( this.params.geoJSON );
            const projection = ProjectionCollection[ this.params.tilematrixset ];
            // const point = geoJSON.getFullLineGeometry().coordinates[0];
            // const geoPoint = new Geodetic3D(Trigonometry.toRadians(point[0]), Trigonometry.toRadians(point[1]), point[2] || 0);
            // const xy = projection.geo2xy(geoPoint);

            const heightTile = new HeightTile( projection );
            heightTile.fromJSON( this.params.hTile );
            obbJSON = heightTile.getOBB()?.toJSON();
            // const heightSourceManager = null;
            // const heightSourceManager = this.params.heightSourceManager;
            // heightSourceManager.fromJSON(this.params.heightSourceManager);
            // const level = this.params.level;
            // while (!heightTile && level !== null && level >= 0) {
            // const identifier = projection.xy2tile(xy[0], xy[1], level);
            // heightTile = heightSourceManager.getHeightTileByName(identifier);
            // level--;
            // }

            const untiled = this.params.untiled;
            for ( let j = 0, feature; (feature = geoJSON.featureCollection.getFeature( j )); j++ ) {

                const viewtype = +feature.properties[ 'viewtype' ]!;
                const local = +feature.properties[ 'local' ]!;
                // Переопределение шаблона высоты
                const heightProps = feature.properties[ 'height' ];
                let height: IMG3DVALUE | undefined;
                if ( heightProps ) {
                    height = {
                        Value: heightProps[ 'heightDef' ],
                        Factor: heightProps[ 'heightSem' ] || 1,
                        Offset: heightProps[ 'heightConstSem' ] || 0,
                        Type: 0
                    };
                    if ( heightProps[ 'keySem' ] !== '' ) {
                        height[ 'Type' ] = 1;
                        height[ 'SemKey' ] = heightProps[ 'keySem' ];
                    }
                }
                let color;
                if ( feature.properties[ 'colorValue' ] != null ) {
                    color = feature.properties[ 'colorValue' ];
                }

                const options = { viewtype, local, height, color };

                const object3dMeshCollection = Object3dCreator.createMesh( feature, options, heightTile, this.params.layerId, untiled );
                if ( object3dMeshCollection !== undefined ) {
                    const featureMeshCollectionList: FeatureMeshCollection[] = [];
                    for ( const minDistance in object3dMeshCollection.meshList ) {
                        const featureMeshList = object3dMeshCollection.meshList[ minDistance ];
                        const featureMeshCollection: FeatureMeshCollection = {
                            features: [],
                            minDistance: +minDistance
                        };
                        for ( let i = 0; i < featureMeshList.length; i++ ) {
                            const featureMesh = featureMeshList[ i ];
                            featureMeshCollection.features.push( featureMesh );
                        }
                        featureMeshCollectionList.push( featureMeshCollection );
                    }
                    objectMeshList.push( featureMeshCollectionList );
                }
            }
        }

        this.runReceive( { objectMeshList, obb: obbJSON } );
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: ServiceObjectsCreatorData ): void {
        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: response
        };

        this.state = MessageState.received;
    }
}

export type Scenario3DRequestParams = {
    serviceUrl: string;
    jsRpc: GetScenarioParams;
}

export type Scenario3DRequestData = {
    jsonfile?: SimpleJson;
}

/**
 * Класс запроса описания сценариев
 * @class Scenario3DRequest
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class Scenario3DRequest extends QueueObject<Scenario3DRequestParams, Scenario3DRequestData> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;

        const serviceUrl = this.params.serviceUrl;

        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        // const cancellableRequest =
        this.createXhr( service.getScenario.bind( service ), this.params.jsRpc, httpParams );

        // this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: SimpleJson } ): void {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }
        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: {
                jsonfile: response.data
            }
        };

        this.state = MessageState.received;
    }

}


export type TrackScenario3DRequestParams = {
    serviceUrl: string;
    jsRpc: GetTrackParams;
}

/**
 * Класс запроса маршрутов сценариев
 * @class TrackScenario3DRequest
 * @extends QueueObject
 * @param messageData {MessageData} Сообщение потока
 */
export class TrackScenario3DRequest extends QueueObject<TrackScenario3DRequestParams, Scenario3DRequestData> {

    /**
     * Запустить процесс
     * @method runProcess
     */
    runProcess() {
        this.state = MessageState.inProcess;

        const serviceUrl = this.params.serviceUrl;
        const httpParams: AxiosRequestConfig & { url: string; } = {
            url: serviceUrl
        };
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
        const cancellableRequest = this.createXhr( service.getTrack.bind( service ), this.params.jsRpc, httpParams );

        this.mAbortMethod = cancellableRequest.abortXhr;
    }

    /**
     * Запустить обработку ответа
     * @method runReceive
     * @param response {object} Ответ
     */
    runReceive( response: { data: SimpleJson } ) {
        if ( this.state === MessageState.stopped || this.state === MessageState.reSend ) {
            return;
        }
        this.responseData = {
            command: this.command,
            id: this.id,
            params: this.params,
            data: {
                jsonfile: response.data
            }
        };

        this.state = MessageState.received;
    }
}
