import { GwtkMapLegendItemReduced, LAYERTYPENAME, SldBuildObject } from '~/types/Types';
import WmsLayer, { LayerParamsItem } from '~/maplayers/WmsLayer';
import { PermanentLayerFilter, LayerTextFilter } from '~/types/LayerOptions';
import { LOCALE } from '~/types/CommonTypes';
import { CommonServiceSVG } from '~/utils/GeoJSON';


export class WmsFilter {
    private layer: WmsLayer;
    private keyList: string | undefined;
    private readonly keyListArray: string[] = [];
    private idList: string | undefined;
    private readonly idListArray: string[] = [];
    private readonly storedFilter: PermanentLayerFilter | undefined;
    private tempFilter: PermanentLayerFilter|null=null;
    private readonly styleFilter: { keylist: string; sld: CommonServiceSVG[] }[];
    private readonly isActive;

    constructor( layer: WmsLayer ) {
        this.layer = layer;
        this.styleFilter = [];
        if ( this.layer.getType() == LAYERTYPENAME.wms ) {
            if ( this.layer.isStoredFilter ) {
                this.storedFilter = {};
                if ( this.layer.storedFilterKeyList ) {
                    this.keyListArray.splice( 0, this.keyListArray.length, ...this.layer.storedFilterKeyList.split( ',' ) );
                    this.keyList = this.keyListArray.join( ',' );
                    this.storedFilter.keylist = this.keyListArray.join( ',' );
                    this.storedFilter.objkeys = this.storedFilter.keylist.split( ',' );
                }
                if ( this.layer.storedTextFilter ) {
                    this.storedFilter.textfilter = this.layer.storedTextFilter;
                }
                if ( this.layer.storedFilterIdList ) {
                    this.idList = this.layer.storedFilterIdList;
                    this.idListArray.splice( 0, this.idListArray.length, ...this.idList.split( ',' ) );
                    this.storedFilter.idlist = this.idListArray.join( ',' );
                    this.storedFilter.objids = this.storedFilter.idlist.split( ',' );
                }
            }
            const layerOptions = this.layer.options;
            if (layerOptions && layerOptions.selectedLegendObjectList.length && layerOptions.selectedLegendObjectStyleOptions) {
                this.createStyleFilter(layerOptions.selectedLegendObjectList, layerOptions.selectedLegendObjectStyleOptions);
            }
            this.isActive = this.layer.isLegend();
        } else {
            this.isActive = false;
        }
    }

    get active(): boolean {
        return this.isActive;
    }

    /**
     * Текущий фильтр слоя по атрибутам
     * @readonly
     * @property textFilter {LayerTextFilter | undefined}
     */
    get textFilter(): LayerTextFilter | undefined {

        let result: LayerTextFilter | undefined;

        if (this.storedFilter) {
            result = this.storedFilter.textfilter;
        }

        if (this.tempFilter && this.tempFilter.textfilter) {
            if (!result) {
                result = this.tempFilter.textfilter;
            } else {
                const resultFilterAND = result.Filter.AND;
                this.tempFilter.textfilter.Filter.AND.forEach(condition => resultFilterAND.push(condition));
            }
        }

        return result;
    }

    /**
     * Получить фильтр ключей объектов
     * @method getKeyListArray
     * @return {string[] | undefined}
     */

    get getKeyListArray(): string[] | undefined {
        return this.keyList !== undefined ? this.keyListArray.slice( 0 ) : undefined;
    }

    get getKeyList(): string | undefined {
        return this.keyList || undefined;
    }

    get storedFilterKeyList(): string | undefined {
        return (this.storedFilter && this.storedFilter.keylist);
    }

    setKeyListArray( keyList: string[] ): void {
        if (!keyList.length) {
            keyList.push('-');
        } else if (keyList.length > 1) {
            const index = keyList.findIndex((item) => item === '-');
            if (index !== -1) {
                keyList.splice(index, 1);
            }
        }

        if ( !this.storedFilterKeyList ) {
            this.keyList = keyList.join( ',' );
            this.keyListArray.splice( 0, this.keyListArray.length, ...this.keyList.split( ',' ) );
        } else {
            this.keyListArray.splice( 0 );
            if ( this.storedFilter && this.storedFilter.objkeys ) {
                for ( const key of keyList ) {
                    if (this.storedFilter.objkeys.includes(key) || key === '-' ) {
                        this.keyListArray.push( key );
                    }
                }
            }
            this.keyList = this.keyListArray.join( ',' );
        }
    }

    /**
     * Добавить временный фильтр
     * @method addTemporaryFilter
     * @param filter {PermanentLayerFilter} Фильтр слоя
     */
    addTemporaryFilter(filter: PermanentLayerFilter) {
        this.tempFilter = filter;
    }

    /**
     * Удалить временный фильтр
     * @method removeTemporaryFilter
     */
    removeTemporaryFilter() {
        this.tempFilter = null;
    }

    /**
     * Флаг наличия временного фильтра
     * @readonly
     * @property hasTemporaryFilter {boolean}
     */
    get hasTemporaryFilter() {
        return this.tempFilter !== null;
    }

    /**
     *Формирование дополнительных стилей для WMS слоя
     * @private
     * @method createStyleFilter
     * @param objectList {GwtkMapLegendItemReduced[]} Массив объектов для применения стиля
     * @param style {SldBuildObject} Объект SLD стиля
     */
    createStyleFilter(objectList: GwtkMapLegendItemReduced[], style: SldBuildObject) {
        const styleFilterObj: { getgraphobjects: string, keylist: string, sld: CommonServiceSVG[] }[] = [];
        objectList.forEach((legendObject, index) => {
            styleFilterObj.push({ getgraphobjects: '0', keylist: '', sld: [] });
            styleFilterObj[index].keylist = legendObject.key;
            if (legendObject.local === LOCALE.Line) {
                style.line.forEach((styleLine) => {
                    styleFilterObj[index].sld.push(
                        {
                            type: 'LineSymbolizer',
                            'stroke': styleLine.stroke?.color,
                            'stroke-opacity': styleLine.stroke?.opacity,
                            'stroke-width': styleLine.stroke?.width,
                            'stroke-dasharray': styleLine.stroke?.dasharray
                        }
                    );
                });
            } else if (legendObject.local === LOCALE.Plane) {
                style.polygon.forEach((stylePolygon) => {
                    if (stylePolygon.fill) {
                        styleFilterObj[index].sld.push(
                            {
                                type: 'PolygonSymbolizer',
                                fill: stylePolygon.fill.color,
                                'fill-opacity': stylePolygon.fill.opacity
                            }
                        );
                    } else if (stylePolygon.stroke) {
                        styleFilterObj[index].sld.push({
                            type: 'LineSymbolizer',
                            'stroke': stylePolygon.stroke?.color,
                            'stroke-opacity': stylePolygon.stroke?.opacity,
                            'stroke-width': stylePolygon.stroke?.width,
                            'stroke-dasharray': stylePolygon.stroke?.dasharray
                        });
                    } else if (stylePolygon.hatch) {
                        styleFilterObj[index].sld.push({
                            'type': 'HatchSymbolizer',
                            'stroke': stylePolygon.hatch.color,
                            'stroke-opacity': stylePolygon.hatch.opacity,
                            'stroke-width': stylePolygon.hatch.width,
                            'stroke-angle': stylePolygon.hatch.angle,
                            'stroke-step': stylePolygon.hatch.step
                        });
                    }
                });
            } else if (legendObject.local === LOCALE.Point) {
                style.marker.forEach((styleMarker) => {
                    const image = styleMarker.marker?.markerDescription?.image;
                    const imageSld = image ? image.split('data:image/png;base64,')[1] : undefined;
                    styleFilterObj[index].sld.push(
                        {
                            type: 'PointSymbolizer',
                            'refX': styleMarker.marker?.markerDescription?.refX,
                            'refY': styleMarker.marker?.markerDescription?.refY,
                            'width': styleMarker.marker?.markerDescription?.width && styleMarker.marker?.markerDescription?.width / 4,
                            'height': styleMarker.marker?.markerDescription?.height && styleMarker.marker?.markerDescription?.height / 4,
                            'markerId': styleMarker.marker?.markerId + '.png',
                            'image': imageSld,
                            'path': styleMarker.marker?.markerDescription?.path,
                        }
                    );
                });
            } else if (legendObject.local === LOCALE.Text) {
                style.text.forEach((styleText) => {
                    styleFilterObj[index].sld.push(
                        {
                            type: 'TextSymbolizer',
                            'stroke': styleText.text?.color,
                            'stroke-width': styleText.text?.contour.width,
                            'style': styleText.text?.contour.color,
                            'text-shadow': styleText.text?.shadow.color,
                            'font-family': styleText.text?.font?.family,
                            'font-style': styleText.text?.font?.style,
                            'font-weight': styleText.text?.font?.weight,
                            'font-size': styleText.text?.font?.size,
                        }
                    );
                });
            }
        });
        this.setStyleFilterArray(styleFilterObj);
    }

    /**
     *Установка массива дополнительных стилей для WMS слоя
     * @private
     * @method setStyleFilterArray
     * @param styleFilterObj {{ keylist: string; sld: CommonServiceSVG[] }[]} массив объектов SLD стиля
     */
    setStyleFilterArray(styleFilterObj: { keylist: string; sld: CommonServiceSVG[] }[]): void {
        if (Array.isArray(this.styleFilter)) {
            this.styleFilter.splice(0);
            this.styleFilter.push(...styleFilterObj);
        }
    }

    setKeyList( keyList: string ): void {
        this.setKeyListArray( keyList.split( ',' ) );
    }

    clearKeyListFilter(): void {
        if ( this.storedFilter && this.storedFilter.keylist ) {
            this.keyListArray.splice( 0, this.keyListArray.length, ...this.storedFilter.keylist.split( ',' ) );
            this.keyList = this.keyListArray.join( ',' );
        } else {
            this.keyList = undefined;
            this.keyListArray.splice( 0 );
        }
    }

    /**
     * Установить список идентификаторов объектов
     * @method setIdListFilter
     * @param idList {String} список идентификаторов объектов
     */
    setIdListFilter( idList: string ): void {
        if ( this.storedFilter && this.storedFilter.idlist ) {
            if ( idList.length == 0 ) {
                this.idList = '';
                this.idListArray.splice( 0 );
            } else {
                this.resetIdList( idList );
            }
        } else {
            if ( idList.length == 0 ) {
                this.idList = undefined;
                this.idListArray.splice( 0 );
            } else {
                this.idList = idList;
                this.idListArray.splice( 0, this.idListArray.length, ...idList.split( ',' ) );
            }
        }
    }

    private resetIdList( idList: string ): void {
        if ( !this.storedFilter || !this.storedFilter.idlist ) {
            return;
        }
        const ids = idList.split( ',' );
        this.idListArray.splice( 0 );
        this.idList = '';
        for ( let i = 0; i < ids.length; i++ ) {
            if ( this.storedFilter.objids?.includes( ids[ i ] ) ) {
                this.idListArray.push( ids[ i ] );
            }
        }
        if ( this.idListArray.length > 0 ) {
            this.idList = this.idListArray.join( ',' );
        }
    }

    toJson(): LayerParamsItem[] {
        const json: LayerParamsItem[] = [];
        if (this.idListArray && this.idListArray.length > 0) {
            json.push({'name': 'idlist', 'value': this.idListArray.join(','), 'type': 'string'});
        } else {
            if (this.keyListArray && this.keyListArray.length > 0) {
                json.push({'name': 'keylist', 'value': this.keyListArray.join(','), 'type': 'string'});
            }
            if (this.textFilter) {
                json.push({'name': 'textfilter', 'value': this.textFilter, 'type': 'json'});
            }
            if (this.styleFilter && this.styleFilter.length > 0) {
                json.push({'name': 'stylefilter', 'value': this.styleFilter, 'type': 'json'});
            }
        }
        return json;
    }

    get disabledAllFilters(): boolean {
        if ( this.layer.storedFilterIdList ) {
            return (this.idList === '');
        }
        if ( this.layer.storedFilterKeyList ) {
            return (this.keyList === '');
        }
        return false;
    }

    clear(): void {
        if ( this.storedFilter ) {
            if ( this.storedFilter.keylist ) {
                this.keyListArray.splice( 0, this.keyListArray.length, ...this.storedFilter.keylist.split( ',' ) );
                this.keyList = this.storedFilter.keylist.slice( 0 );
            }
            if ( this.storedFilter.idlist ) {
                this.idListArray.splice( 0, this.idListArray.length, ...this.storedFilter.idlist.split( ',' ) );
                this.idList = this.storedFilter.idlist.slice( 0 );
            }
        } else {
            this.keyList = undefined;
            this.keyListArray.splice( 0 );
            this.idList = undefined;
            this.idListArray.splice( 0 );
        }
    }

    clearIdListFilter(): void {
        if ( !this.storedFilter || !this.storedFilter.idlist ) {
            this.idList = undefined;
            this.idListArray.splice( 0 );
        } else {
            this.idListArray.splice( 0, this.idListArray.length, ...this.storedFilter.idlist.split( ',' ) );
            this.idList = this.idListArray.join( ',' );
        }
    }

    destroy(): void {
        if ( this.storedFilter ) {
            if ( this.storedFilter.idlist ) {
                this.storedFilter.idlist = undefined;
                this.storedFilter.objids = undefined;
            }
            if ( this.storedFilter.keylist ) {
                this.storedFilter.keylist = undefined;
                this.storedFilter.objkeys = undefined;
            }
            this.storedFilter.textfilter = undefined;
        }
        this.keyList = undefined;
        this.keyListArray.splice( 0 );
        this.idList = undefined;
        this.idListArray.splice( 0 );
    }

}
