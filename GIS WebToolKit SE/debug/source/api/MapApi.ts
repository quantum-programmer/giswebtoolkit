/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       API функции карты                          *
 *                            GWTK SE                               *
 *                                                                  *
 *******************************************************************/
import { GwtkMap, UserControl } from '~/types/Types';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import Layer from '~/maplayers/Layer';
import MapObject from '~/mapobject/MapObject';
import Utils from '~/services/Utils';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import { ForcedParameters, GwtkOptions, GwtkLayerDescription } from '~/types/Options';
import GeoPoint from '~/geo/GeoPoint';
import { Bounds } from '~/geometry/Bounds';
import { GeoJsonType } from '~/utils/GeoJSON';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import { SimpleJson, ContainsSomeOf, LogEventType, LogMessage } from '~/types/CommonTypes';
import { MapPoint } from '~/geometry/MapPoint';
import { SourceType, GISWebServiceSEMode } from '~/services/Search/SearchManager';
import { GwtkMapperResult } from '~/services/Search/mappers/GwtkMapper';
import { SemanticOperator } from '~/services/Search/criteria/SemanticSearchCriterion';


export type SearchObjectsResult = {
    objectCount: number,
    filePath: string,
    layer: string,
    ids: string
};

/**
 * Показать весь слой в окне карты
 * @method mapViewEntireLayer
 * @param map карта
 * @param maplayer слой карты
 * @return {number} 1 -выполнено, 0 -ошибка параметров, -1 -экстент вне габаритов карты
 */
export async function mapViewEntireLayer(map: GwtkMap, maplayer: Layer): Promise<0 | 1 | -1> {

    if (maplayer instanceof GeoJsonLayer) {
        const bounds = maplayer.getBounds();
        if (bounds) {
            map.showMapExtentPlane(bounds.min, bounds.max);
            return 1;
        }
        return 0;
    }

    if (!maplayer.idLayer || !maplayer.options.url) {
        return 0;
    }
    const url = maplayer.serviceUrl;
    const httpParams = RequestServices.createHttpParams(map, { url });
    const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
    // запросить габариты слоя
    const response = await service.getBound({ LAYER: maplayer.idLayer, EpsgList: map.getCrsString() });
    if (response.data && response.data.restmethod) {
        const responseData = response.data.restmethod.outparams[maplayer.idLayer];
        let coord: string[];
        const coordNumber: number[] = [];
        if (responseData.BorderInBaseProjection) {
            coord = responseData.BorderInBaseProjection.split(' ');
        } else {
            const coordString = responseData[map.Translate.EpsgCode.toString()];
            if (coordString) {
                coord = coordString.split(' ');
            } else {
                coord = [];
            }
        }
        // вписать в окно карты
        if (coord.length === 4) {
            coord.forEach((value) => {
                coordNumber.push(+value);
            });

            if (map.Translate.IsGeoSupported === +responseData.SupportGeodesy) {
                const result=mapShowExtentPlane(map, coordNumber);
                if (result !== -1) {
                    let zoom = map.options.tilematrix;
                    if (maplayer.minZoomView) {
                        zoom = Math.max(zoom, maplayer.minZoomView);
                    }

                    if (maplayer.maxZoomView) {
                        zoom = Math.min(zoom, maplayer.maxZoomView);
                    }
                    if (zoom !== map.options.tilematrix) {
                        map.setView(map.mapcenter, zoom);
                    }
                }
                return result;
            } else {
                map.writeProtocolMessage({
                    text: 'mapViewEntireLayer ' + map.translate('Incorrect data format of the server response'),
                    description: 'GETBOUND.response: ' + JSON.stringify(response),
                    display: true,
                    type: LogEventType.Error
                });
            }
        } else {
            map.writeProtocolMessage({
                text: 'mapViewEntireLayer ' + map.translate('Incorrect data format of the server response'),
                display: true,
                description: 'GETBOUND.response: ' + JSON.stringify(response.data.restmethod),
                type: LogEventType.Error
            });
        }
    } else {
        map.writeProtocolMessage({
            text: 'mapViewEntireLayer ' + map.translate('Incorrect data format of the server response'),
            description: 'GETBOUND.response: ' + JSON.stringify(response),
            display: true,
            type: LogEventType.Error
        });
    }
    return 0;
}

/**
 * Показать экстент в окне карты
 * @method mapShowExtent
 * @param map карта
 * @param coord координаты углов экстента, [долгота, широта, долгота, широта]
 */
export function mapShowExtent(map: GwtkMap, coord: string[]) {

    if (!map.maxBounds) {
        map.showMapExtent(parseFloat(coord[1]), parseFloat(coord[0]), parseFloat(coord[3]), parseFloat(coord[2]));
        return;
    }

    let min = new GWTK.LatLng(parseFloat(coord[1]), parseFloat(coord[0])),
        max = new GWTK.LatLng(parseFloat(coord[3]), parseFloat(coord[2]));

    const minMapPoint = new GeoPoint(min.lng, min.lat, 0, map.ProjectionId).toMapPoint();
    const maxMapPoint = new GeoPoint(max.lng, max.lat, 0, map.ProjectionId).toMapPoint();


    if (!map.maxBounds.intersects(new Bounds(minMapPoint, maxMapPoint))) {
        console.log('mapShowExtent. ' + map.translate('Layer bounds are out of max bounds of the map'));
        return;
    }

    // обрезаем экстент по maxBounds карты
    let max_sw = map.maxBounds.min.toGeoPoint(),
        max_ne = map.maxBounds.max.toGeoPoint();

    if (max_sw) {
        if (min.lat < max_sw.getLatitude()) {
            min.lat = max_sw.getLatitude();
        }
        if (min.lng < max_sw.getLongitude()) {
            min.lng = max_sw.getLongitude();
        }
    }

    if (max_ne) {
        if (max.lat > max_ne.getLatitude()) {
            max.lat = max_ne.getLatitude();
        }

        if (max.lng > max_ne.getLongitude()) {
            max.lng = max_ne.getLongitude();
        }
    }

    map.showMapExtent(min.lat, min.lng, max.lat, max.lng);
}

/**
 * Показать экстент в окне карты
 * @method mapShowExtentPlane
 * @param map карта
 * @param coord координаты углов экстента, [долгота, широта, долгота, широта] в метрах
 * @return {number} 1 -выполнено, 0 -ошибка параметров, -1 -экстент вне габаритов карты
 */
export function mapShowExtentPlane(map: GwtkMap, coord: number[]): 0 | 1 | -1 {
    if (coord.length < 4) {
        return 0;
    }
    const minMapPoint = MapPoint.fromOriginArray([coord[0], coord[1], 0], map.ProjectionId);
    const maxMapPoint = MapPoint.fromOriginArray([coord[2], coord[3], 0], map.ProjectionId);

    if (!map.maxBounds) {
        return map.showMapExtentPlane(minMapPoint, maxMapPoint);
    }


    if (!map.maxBounds.intersects(new Bounds(minMapPoint, maxMapPoint))) {
        return -1;
    }

    const maxMinCoord = coord.slice();

    // обрезаем экстент по maxBounds карты
    const max_sw = map.maxBounds.min;
    const max_ne = map.maxBounds.max;

    maxMinCoord[0] = Math.max(maxMinCoord[0], max_sw.x);
    maxMinCoord[1] = Math.max(maxMinCoord[1], max_sw.y);

    maxMinCoord[2] = Math.min(maxMinCoord[2], max_ne.x);
    maxMinCoord[3] = Math.min(maxMinCoord[3], max_ne.y);

    const boundsMapLeft = new MapPoint(maxMinCoord[0], maxMinCoord[1], 0, map.ProjectionId);
    const boundsMapRight = new MapPoint(maxMinCoord[2], maxMinCoord[3], 0, map.ProjectionId);
    return map.showMapExtentPlane(boundsMapLeft, boundsMapRight);
}

/**
 * Поиск объектов карты по идентификаторам объектов
 * @method mapSearchObjectsByIdList
 * @param map {Object} карта GwtkMap
 * @param idLayer { String } идентификатор слоя сервиса карт
 * @param ids { String } список идентификаторов объектов карты в виде gml.id через запятую
 * @return { SearchObjectsResult | undefined }
 */
export function mapSearchObjectsByIdList(map: GwtkMap, idLayer: string, ids: string) {
    const mapLayer = map.tiles.getLayerByIdService(idLayer);
    if (!mapLayer || !mapLayer.server) {
        return;
    }

    const searchresult: SearchObjectsResult = {
        'objectCount': 0,
        'filePath': '',
        'layer': idLayer,
        'ids': ids
    };
    const param = {
        LAYER: idLayer,
        OBJLOCAL: '0,1,2,3,4',
        IDLIST: ids,
        OUTTYPE: OUTTYPE.JSON
    };
    const url = mapLayer.options.url;
    const uri = Utils.parseUrl(url);
    const server = uri.origin + '/' + uri.pathname;
    const httpParams = RequestServices.createHttpParams(map, { url: server });
    const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
    service.getFeature([param])
        .then((result) => {
            let response;
            if (typeof result.data === 'string') {
                response = JSON.parse(result.data);
            } else response = result.data;
            const data = map.onSearchDataLoaded(response);             // разбор ответа
            searchresult.objectCount = data.mapObjects?.length;
            searchresult.filePath = data?.filePath;
            if (data.mapObjects) {
                map.setFoundObject(data.mapObjects);                   // установить в карту
            } else {
                if (data.filePath) {
                    console.log('mapSearchObjectsByIdList. Too many objects selected on request!');
                } else {
                    console.log('mapSearchObjectsByIdList. Failed to get data.');
                }
            }
        })
        .catch((reason) => {
            console.log('mapSearchObjectsByIdList Error.', reason);
        });
    return searchresult;
}

/**
 * Получение данных из файла
 * @method mapGetFileData
 * @param url { string } адрес сервиса карт
 * @param filepath { string } имя файла на сервере
 * @return { json | undefined } данные объектов
 */
export function mapGetFileData(url: string, filepath: string) {
    const service = RequestServices.retrieveOrCreate({ url: url }, ServiceType.REST);
    return service.getFile({ FILEPATH: filepath }, { url })
        .then((result) => {
            return result;
        })
        .catch((reason) => {
            console.log('mapGetFileData. Failed to get data', filepath);
            console.log(reason);
        });
}

/**
 * Получение объектов карты из файла
 * @method mapGetObjectsByFileData
 * @param map {Object} карта GwtkMap
 * @param url { String } адрес сервиса карт
 * @param filepath { String } имя файла на сервере
 * @return { SearchObjectsResult | undefined }
 */
export async function mapGetObjectsByFileData(map: GwtkMap, url: string, filepath: string) {
    const searchResult: SearchObjectsResult = {
        'objectCount': 0,
        'filePath': '',
        'layer': '',
        'ids': ''
    };
    const result = await mapGetFileData(url, filepath);
    if (typeof result !== 'undefined') {
        const data = map.onFileDataLoaded(result);               // разбор ответа
        searchResult.objectCount = data.mapObjects?.length;
        if (data.mapObjects) {
            map.setFoundObject(data.mapObjects);                 // установить в карту
        } else {
            console.log('mapSearchObjectsByFileData. Failed to get data', url);
        }
    }
    return searchResult;
}

/**
 * Получение параметров карты из строки запроса
 * @method loadFromUrl
 * @param options {GwtkOptions} Параметры карты (будет добавлено поле с параметрами из строки запроса)
 */
export function loadFromUrl(options: GwtkOptions) {
    if (window.location.href.length > 2048) {
        return;
    }
    const urlParams = window.location.search.substring(1).split('&');
    if (urlParams.length !== 0) {
        let forcedParams: ForcedParameters = {};
        for (let i = 0; i < urlParams.length; i++) {
            const getVar = urlParams[i].split('=');
            if(!getVar[0]) {
                continue;
            }
            forcedParams[getVar[0] as keyof ForcedParameters] = getVar[1] === undefined ? '' : getVar[1];
        }
        if (Reflect.ownKeys(forcedParams).length > 0) {
            options.forcedParams = {...options.forcedParams, ...forcedParams};
        }
    }
}

/**
 * Сформировать идентификатор проекции
 * @param epsg код Epsg или 0
 * @param tileSize размер тайла
 * @param url адрес сервиса для запроса
 * @param layerid идентификатор слоя, если код Epsg = 0
 * @returns
 */
export function buildCrsIdent(epsg: number, tileSize = 256, url?: string, layerid?: string): string {
    let projectionId = 'EPSG=' + epsg.toString() + 'TileSize=' + tileSize.toString();

    if (epsg == 0) {
        projectionId = 'Id=' + layerid + 'Url=' + url + 'TileSize=' + tileSize.toString();
    }
    return projectionId;
}

/**
 * Преобразовать данные объектов карты в CSV формат
 * @param map {Object} карта GwtkMap
 * @param objectList { MapObject[] } массив объектов карты
 * @returns { Blob } данные объектов карты в CSV
 */
export function mapMapObjectsList2BlobCsv(map: GwtkMap, objectList: MapObject[]): Blob {
    const headersList = map.generateHeadersListForCsv(objectList);
    return Utils.mapObjectsToCsv(objectList, headersList);
}

type ExternalData = {
    hideObjectPanel?: boolean;
} & ContainsSomeOf<GwtkLayerDescription>

/**
 * Установить результат поиска объектов из GeoJSON
 * @param map {GwtkMap} ссылка на карту
 * @param featureCollection {GeoJsonType} GeoJSON
 * @param params {ExternalData} Дополнительные параметры
 * @return {MapObject[]} Добавленные объекты карты
 */
export function mapSetSearchResultsFromGeoJSON(map: GwtkMap, featureCollection: GeoJsonType, params: ExternalData = {}): Readonly<MapObject[]> {
    if (!featureCollection) {
        return [];
    }

    const { hideObjectPanel = false } = params;

    const layer = new GeoJsonLayer(map, {
        alias: 'External source',
        id: Utils.generateGUID(),
        url: '',
        ...params
    }, JSON.stringify(featureCollection));

    const mapObjects = layer.getAllMapObjects();

    map.clearSelectedFeatures();
    map.clearSelectedObjects();
    map._setSearchManager(mapObjects);

    if (!hideObjectPanel) {
        map.trigger({ type: 'searchreasultsforceupdate', target: 'map' });
    }

    return mapObjects;
}


/**
 * Создать пользовательский элемент управления (расширение библиотеки)
 * @param name {string} уникальное имя контрола
 * @param map {GwtkMap} ссылка на карту
 * @param options {Object} объект параметров, описание методов прототипа контрола
 * @param apply {boolean} признак инициализации, `true` - выполнить инициализацию после создания,
 *                                               `false` - только создать
 * @return {UserControl} элемент управления, экземпляр
 */
export function mapCreateUserControl(name: string, map: GwtkMap, options: SimpleJson, apply: boolean): UserControl | undefined {

    if (!map)
        return;

    if (GWTK[name]) {
        GWTK[name].destroy();
        delete GWTK[name];
        console.log('А unique component name is required.' + ' ' + name + ' name is used' + '!');
    }

    const ucontrol: UserControl = new GWTK.UserControl(name, map, options, apply);
    if (ucontrol.error()) {
        return;
    }
    GWTK[name] = ucontrol;

    if (typeof map.registerMapPlugin === 'function' && ucontrol.button && ucontrol.toolname !== 'toolbar3d') {
        const { id, title } = ucontrol.button;
        const { icon, toolbar } = options;
        const pluginDescription = {
            id,
            title,
            icon,
            specifiedToolbar: toolbar
        };

        map.registerMapPlugin(pluginDescription);
    }

    return ucontrol;
}

export function geoJsonToMapObjects(map: GwtkMap, json: GeoJsonType, serviceUrl?: string): MapObject[] {
    const mapObjects: MapObject[] = [];

    if (!json || !json.type || 'FeatureCollection' !== json.type) {
        return mapObjects;
    }
    const features = json.features;
    if (!Array.isArray(features)) {
        return mapObjects;
    }
    for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        const layerId = feature.properties.mapid;
        if (layerId) {
            const layer = map.getVectorLayer(layerId, serviceUrl);
            if (layer) {
                mapObjects.push(MapObject.fromJSON(layer, feature));
            }
        }
    }
    return mapObjects;
}

export function mapGetSelectedFeaturesIdList(map: GwtkMap): string[] {
    const result = [];
    for (const mapObject of map.getSelectedObjectsIterator()) {
        result.push(mapObject.id);
    }
    return result;
}

export function mapSetMapRefreshPeriod(map: GwtkMap, seconds: number): boolean {
    let result = false;
    if (typeof map !== 'undefined') {
        map.tiles.setRefreshInterval(seconds);
        result = true;
    }
    return result;
}

export function mapWriteProtocolMessage(map: GwtkMap, options: LogMessage): boolean {
    map.writeProtocolMessage(options);
    return true;
}

export function mapGetObjectsSemantic(map: GwtkMap, layerid: string, key: string): string[] {
    const result: string[] = [];
    for (const mapObject of map.getSelectedObjectsIterator()) {
        if (mapObject.layerId != layerid) {
            continue;
        }
        const count = mapObject.getSemantics().length;
        for (let j = 0; j < count; j++) {
            if (mapObject.getSemantics()[j].key === key) {
                if (result.indexOf(mapObject.getSemantics()[j].value) == -1) {
                    result.push(mapObject.getSemantics()[j].value);
                }
            }
        }
    }
    return result;
}

export function mapGetLayerById(map: GwtkMap, ids: string[] | string): Layer[] {
    const layers: Layer[] = [];
    const xid: string[] = [];

    if (typeof ids === 'string') {
        xid.push(ids);
    } else {
        if (Array.isArray(ids)) {
            xid.splice(0).concat(ids);
        }
    }
    try {
        for (let i = 0; i < xid.length; i++) {
            const ml = map.tiles.getLayerByxId(xid[i]);
            if (ml != null) {
                layers.push(ml);
            }
        }
    } catch (e) {
        map.writeProtocolMessage({ text: e as string, type: LogEventType.Error, display: false });
    }
    return layers;
}

export function mapOpenLayers(map: GwtkMap, options: GwtkLayerDescription[]): number {
    if (!map) {
        return 0;
    }
    if (!Array.isArray(options)) {
        return 0;
    }
    const openned: {
        layers: Layer[],
        others: number
    } = {
        layers: [],
        others: 0
    };
    for (let i = 0; i < options.length; i++) {
        if (options[i].folder) {
            continue;
        }
        const layer = map.openLayer(options[i]);
        if (layer) {
            openned.layers.push(layer);
            if (layer.getType() !== 'wms') {
                openned.others = 1;
            }
        }
    }
    const result = openned.layers.length;
    if (result > 0) {
        for (let i = 0; i < result; i++) {
            openned.layers[i].visible = !openned.layers[i].options.hidden;
        }
        if (openned.others != 0) {
            map.tiles.forceUpdate();
        } else {
            map.tiles.wmsUpdate();
        }
    }
    return result;
}

export function mapRemoveLayer(map: GwtkMap, layers: string[]): boolean {
    if (!map || !(map instanceof GWTK.Map)) {
        return false;
    }
    if (!layers || !Array.isArray(layers)) {
        return false;
    }
    let res = 0;
    try {
        for (let i = 0; i < layers.length; i++) {
            if (map.closeLayer(layers[i]) == 1) {
                res = 1;
            }
        }
    } catch (e) {
        map.writeProtocolMessage({ text: e as string, type: LogEventType.Error, display: false });
        res = 0;
    }
    return (res === 1);
}

export function mapRemoveLayerById(map: GwtkMap, ids: string[] | string): boolean {
    const xid = [];
    if (!map || !(map instanceof GWTK.Map)) {
        return false;
    }
    if (!ids) {
        return false;
    }
    if (typeof ids === 'string') {
        xid.push(ids);
    }
    if (Array.isArray(ids)) {
        xid.splice(0).concat(ids);
    } else {
        return false;
    }

    let res = 0;

    try {
        for (let i = 0; i < xid.length; i++) {
            if (map.closeLayer(xid[i]) == 1) {
                res = 1;
            }
        }
    } catch (e) {
        map.writeProtocolMessage({ text: e as string, type: LogEventType.Error, display: false });
        res = 0;
    }
    return (res === 1);
}

export function mapSetView(map: GwtkMap, center: MapPoint, zoom: number): boolean {
    if (!map || !(map instanceof GWTK.Map)) {
        return false;
    }
    if (!center || !(Array.isArray(center) && center.length == 2)) {
        return false;
    }
    let res = 0;
    try {
        map.setView(center, zoom);
        res = 1;
    } catch (e) {
        map.writeProtocolMessage({ text: e as string, type: LogEventType.Error, display: false });
    }
    return (res === 1);
}

export function mapChangeLayerVisibility(map: GwtkMap, layers: Layer[], visibility: boolean): boolean {
    if (!map || !(map instanceof GWTK.Map)) {
        return false;
    }
    if (!layers && !Array.isArray(layers)) {
        return false;
    }

    try {
        for (let i = 0; i < layers.length; i++) {
            layers[i].visible = visibility;
        }
        return true;
    } catch (e) {
        map.writeProtocolMessage({ text: e as string, type: LogEventType.Error, display: false });
    }
    return false;
}

export function mapChangeLayerVisibilityById(map: GwtkMap, ids: string[], visibility: boolean): boolean {
    if (!map || !(map instanceof GWTK.Map)) {
        return false;
    }
    if (!ids && !Array.isArray(ids)) {
        return false;
    }

    try {
        // Запросим контекст с деревом
        for (let i = 0; i < ids.length; i++) {
            for (let j = 0; j < map.layers.length; j++) {
                if (ids[i] === map.layers[j].xId) {
                    map.layers[j].visible = visibility;
                }
            }
            return true;
        }
    } catch (e) {
        map.writeProtocolMessage({ text: e as string, type: LogEventType.Error, display: false });
    }
    return false;
}

export function mapShowLayer(map: GwtkMap, layers: Layer[]): boolean {
    return mapChangeLayerVisibility(map, layers, true);
}

export function mapShowLayerById(map: GwtkMap, ids: string[]): boolean {
    return mapChangeLayerVisibilityById(map, ids, true);
}

export function mapHideLayer(map: GwtkMap, layers: Layer[]) {
    mapChangeLayerVisibility(map, layers, false);
}

export function mapHideLayerById(map: GwtkMap, ids: string[]) {
    mapChangeLayerVisibilityById(map, ids, false);
}

/**
 * Найти объекты карты по семантике
 * @function mapSearchObjectsBySemanticListEx
 * @param map {GwtkMap} Экземпляр карты
 * @param options {object} массив JSON's, [GWTK.SemanticsSearchOptions]), параметры поиска (см. mapapitypes.js, по слоям)
 * @param [showObjectPanel] {boolean} Флаг отображения панели объектов
 * @return {Promise} `true` при успешном выполнении, `false` при ошибке
 */
export function mapSearchObjectsBySemanticListEx(map: GwtkMap, options: {
    layerid: string;
    keys: string[];
    values: string[];
}[], showObjectPanel = false): Promise<GwtkMapperResult | undefined> {

    const fname = 'GWTK.mapSearchObjectsBySemanticList: ';

    if (!(map instanceof GWTK.Map)) {
        return Promise.reject(fname + 'Not defined a required parameter: map');
    }

    if (!Array.isArray(options)) {
        return Promise.reject(fname + map.translate('Not defined a required parameter') + ': options');
    }

    const searchManager = map.searchManager;

    searchManager.clearSearchCriteriaAggregator();

    const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
    const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
    srsNameSearchCriterion.setValue(map.getCrsString());
    criteriaAggregatorCopy.setSrsNameSearchCriterion(srsNameSearchCriterion);

    const layers = [];
    const filteredOptions = [];
    for (let i = 0; i < options.length; i++) {
        const semfilter = options[i];
        const layer = map.tiles.getLayerByIdService(semfilter.layerid);

        if (layer) {
            layers.push(layer);
            filteredOptions.push({ ...semfilter, xId: layer.xId });
        }
    }

    searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All, layers);

    for (let i = 0; i < filteredOptions.length; i++) {
        const semfilter = filteredOptions[i];

        const criteriaAggregatorCopy = searchManager.getLayerCriteriaAggregatorCopy(semfilter.xId);
        if (criteriaAggregatorCopy) {
            const semanticSearchCriterion = criteriaAggregatorCopy.getSemanticSearchCriterion();
            semanticSearchCriterion.setLogicalDisjunction(true);
            for (let j = 0; j < semfilter.keys.length; j++) {
                semanticSearchCriterion.addSemanticCriterion({ key: semfilter.keys[j], operator: SemanticOperator.InList, value: semfilter.values });
            }
            criteriaAggregatorCopy.setSemanticSearchCriterion(semanticSearchCriterion);
            searchManager.setLayerCriteriaAggregator(criteriaAggregatorCopy);
        }
    }

    searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);

    const findPromise = searchManager.findNext();

    if (showObjectPanel) {
        findPromise.then(result => {
            if (result) {
                map.taskManagerNew.showObjectPanel();
            }
        });
    }

    return findPromise;
}
