/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Векторный слой локальный (GeoJSON)                  *
 *                                                                  *
 *******************************************************************/

import { GwtkMap, LAYERTYPENAME, DownloadFormat } from '~/types/Types';
import { GwtkLayerDescription } from '~/types/Options';
import { ClassifierJson } from '~/classifier/Classifier';
import { GeoJsonType } from '~/utils/GeoJSON';
import RenderableLayer from '~/maplayers/RenderableLayer';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import Utils from '~/services/Utils';
import GeoJsonSource from '~/sources/GeoJsonSource';


/**
 * Векторный слой локальный (GeoJSON)
 * @class GeoJsonLayer
 * @extends RenderableLayer
 */
export default class GeoJsonLayer extends RenderableLayer {

    protected readonly isEditableFlag: boolean;
    protected readonly memoryIsLocked: boolean;

    protected source: GeoJsonSource;

    /**
     * @constructor GeoJsonLayer
     * @param map {GwtkMap} Экземпляр карты
     * @param options {Options} Параметры слоя
     * @param [json] {string} GeoJSON строка
     * @param [params] {true} Флаг нередактируемого слоя
     */
    constructor( map: GwtkMap, options: GwtkLayerDescription, json?: string | GeoJsonType, params = {
        isReadonly: true,
        isLocked: false
    } ) {
        super( map, options );
        this.options.export = ['json', 'csv', 'mif', 'shp', 'sxf', 'dxf'];
        this.format = 'svg';

        this.isEditableFlag = !params.isReadonly;

        this.memoryIsLocked = params.isLocked;

        this.source = new GeoJsonSource( this, json );

        this.options.schemename = this.xId;

        const classifierJson = {
            legend: undefined,
            semanticList: [],
            classifierSemanticList: [],
            rscObjectList: {
                '': {
                    code: '',
                    local: '',
                    segment: '',
                    scale: '',
                    direct: '',
                    bot: '',
                    top: '',
                    name: '',
                    key: '',
                    rscsemantics: [
                        {
                            code: '9',
                            type: '0',
                            reply: '0',
                            enable: '1',
                            service: '0',
                            name: this.map.translate( 'Object name' ),
                            unit: '',
                            minimum: '0',
                            defaultvalue: '0',
                            maximum: '0',
                            size: '255',
                            decimal: '0',
                            shortname: 'ObjName'
                        },
                        {
                            code: '32856',
                            type: '0',
                            reply: '0',
                            enable: '1',
                            service: '0',
                            name: this.map.translate( 'Object identifier' ),
                            unit: '',
                            minimum: '0',
                            defaultvalue: '0',
                            maximum: '0',
                            size: '255',
                            decimal: '0',
                            shortname: 'ObjectIdent'
                        },
                        {
                            code: '32857',
                            type: '0',
                            reply: '0',
                            enable: '1',
                            service: '0',
                            name: this.map.translate( 'Object information' ),
                            unit: '',
                            minimum: '0',
                            defaultvalue: '0',
                            maximum: '0',
                            size: '255',
                            decimal: '0',
                            shortname: 'ObjInfo'
                        }
                    ]
                }
            }
        } as ClassifierJson;

        this.classifier.fromJson( classifierJson );

        this.selectObject = this.options.selectObject = true;
    }

    onAdd() {
        if ( this.visible ) {
            this.map.requestRender();
        }
    }

    get isEditable() {
        return this.isEditableFlag;
    }

    get isLocked() {
        return this.memoryIsLocked;
    }

    get typeName() {
        return LAYERTYPENAME.svg;
    }

    /**
     * Получение всех объектов
     * @deprecated
     * @method getAllMapObjects
     * @return {MapObject[]} Объекты карты
     */
    getAllMapObjects() {
        return this.source.mapObjectList;
    }

    async download( formatOptions: DownloadFormat ): Promise<Blob | undefined> {
        if ( formatOptions.outType === OUTTYPE.CSV ) {
            const result = await this.map.searchManager.findAllObjects( [this], true );

            if ( result !== undefined && result.mapObjects ) {
                // Сформировать csv файл
                return Utils.mapObjectsToCsvGeometry( result.mapObjects );
            }
        } else {
            return super.download( formatOptions );
        }
    }

    getBounds() {
        return this.source.bounds;
    }

    removeJsonData() {
        return this.source.removeJsonData();
    }

    static getEmptyInstance(map: GwtkMap, alias = '', url = '') {
        return new GeoJsonLayer(map, {alias, id: Utils.generateGUID(), url});
    }

}
