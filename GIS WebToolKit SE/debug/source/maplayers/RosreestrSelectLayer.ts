/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Росреестр-слой карты                       *
 *                                                                  *
 *******************************************************************/

import {GwtkMap} from '~/types/Types';
import WmsLayer, {GetImageRequestParams} from './WmsLayer';
import {GwtkLayerDescription} from '~/types/Options';
import {Bounds} from '~/geometry/Bounds';
import Utils from '~/services/Utils';
import { RosreestrQueryType } from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';

const ROSREESTR_DEFAULT_URL = 'https://pkk.rosreestr.ru/arcgis/rest/services/PKK6/CadastreSelected/MapServer/export?';
const ROSREESTR_ZONES_URL = 'https://pkk.rosreestr.ru/arcgis/rest/services/PKK6/ZONESSelected/MapServer/export?';
const ROSREESTR_BORDER_URL = 'https://pkk.rosreestr.ru/arcgis/rest/services/PKK6/BordersGKNSelected/MapServer/export?';

export default class RosreestrSelectLayer extends WmsLayer {

    rosreestrObject = '';
    constructor(map: GwtkMap, layerdescription: GwtkLayerDescription) {
        layerdescription.url = ROSREESTR_DEFAULT_URL;
        super(map, layerdescription);

        const rosreestrService=this.map.options.remoteServices?.find(item => item.type === 'Rosreestr');
        if (rosreestrService) {
            const proxy = rosreestrService.url.slice(0, rosreestrService.url.indexOf('https://pkk.rosreestr.ru'));
            if (proxy) {
                this.url = this.options.url = proxy + this.options.url;
                const uri = Utils.parseUrl(this.url);
                this.server = uri.origin + '/' + uri.pathname;
            }
        }

        this.options.minzoomview = 12;
        this.options.norpc = 1;
        this.options.zIndex=9999;

        this.map.tiles.viewOrder.push(this.xId);
        this.map.tiles.wmsManager.registerLayer(this);

    }

    initOpacity(value?: string | number): string {
        return '0.5';
    }

    protected async getParamsGetImage(): Promise<GetImageRequestParams[]> {
        return [{url: ''}];

        //TODO:отключаем росреестр

        // const result = [{url: ''}];
        // if (this.rosreestrObject.length) {
        //     const BBOX = this.prepareBboxParameter(this.map.getWindowBounds());
        //     const layerDefs = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [
        //         `${i}`,
        //         `ID = '${this.rosreestrObject}'`
        //     ]));
        //
        //     const size = this.map.getWindowSize();
        //     if (this.map.getActiveObject()?.layerId === RosreestrQueryType.USE_RESTRICTED_ZONE + ''
        //         || this.map.getActiveObject()?.layerId === RosreestrQueryType.SPECIALLY_NATURAL_AREA + ''
        //         || this.map.getActiveObject()?.layerId === RosreestrQueryType.TERRITORIAL_AREA + '') {
        //         this.url = ROSREESTR_ZONES_URL;
        //     } else if (this.map.getActiveObject()?.layerId === RosreestrQueryType.BOUNDARY + '') {
        //         this.url = ROSREESTR_BORDER_URL;
        //     } else { this.url = ROSREESTR_DEFAULT_URL; }
        //
        //     if (this.map.getActiveObject()?.layerId === RosreestrQueryType.LAND_DISTRICT + '') {
        //         this.options.minzoomview = 4;
        //     } else if (this.map.getActiveObject()?.layerId === RosreestrQueryType.LAND_AREA + '') {
        //         this.options.minzoomview = 5;
        //     }
        //     result[0].url = this.url + encodeURI(
        //         'bbox=' + BBOX +
        //         '&size=' + size[0] + ',' + size[1] +
        //         '&bboxSR=102100' +
        //         '&imageSR=102100' +
        //         '&dpi=96' +
        //         '&transparent=true' +
        //         '&format=png32' +
        //         '&layers=show:' + Reflect.ownKeys(layerDefs).join(',') +
        //         '&layerDefs=' + JSON.stringify(layerDefs) +
        //         '&f=image'
        //     );
        // }
        //
        // return result;
    }

    /**
    * Получить параметр bbox запроса
    * @param {Bounds} bbox, метры
    * @returns {string} строка значений параметра bbox
    */
    protected prepareBboxParameter(bbox: Bounds) {
        if (this.map.Translate.isGeoSys()) {
            const geobounds = this.map.tileMatrix.getGeoDegreeFrameFromPlaneFrame(bbox);
            if (geobounds) {
                const geobbox = geobounds.toBBox();
                return geobbox.join();
            }
            return '';
        }
        const bboxPlane = [];
        bboxPlane.push(...bbox.min.toOrigin().slice(0, 2));
        bboxPlane.push(...bbox.max.toOrigin().slice(0, 2));
        return bboxPlane.join(',');
    }
}
