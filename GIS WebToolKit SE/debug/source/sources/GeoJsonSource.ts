/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Источник векторных данных                      *
 *                                                                  *
 *******************************************************************/

import VectorSource from '~/sources/VectorSource';
import MapObject from '~/mapobject/MapObject';
import { CommitTransactionAnswer } from '~/sources/AbstractVectorSource';
import GeoJSON, { GeoJsonType, CRS } from '~/utils/GeoJSON';
import WorkspaceManager from '~/utils/WorkspaceManager';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import TextStyle from '~/style/TextStyle';
import Style from '~/style/Style';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import { Bounds } from '~/geometry/Bounds';
import TranslateList from '~/translate/TTranslateList';


/**
 * Источник векторных данных
 * @class GeoJsonSource
 * @extends VectorSource
 */
export default class GeoJsonSource extends VectorSource {

    private readonly crs: CRS;

    private get workspaceManager(): WorkspaceManager {
        return this.layer.map.workspaceManager;
    }

    get projectionId() {
        if (this.crs.type === 'name') {
            return this.crs.properties.name;
        } else {
            return this.crs.properties.href;
        }
    }

    get bounds(): Bounds | undefined {
        let bounds;
        if (this.objectStorage.count > 0) {
            for (const mapObject of this.objectStorage.iterator) {
                const mapObjectBounds = mapObject.getBounds();
                if (!bounds) {
                    bounds = mapObjectBounds.clone();
                } else {
                    bounds.extend(mapObjectBounds.min);
                    bounds.extend(mapObjectBounds.max);
                }
            }
        }
        return bounds;
    }

    constructor(private readonly layer: GeoJsonLayer, json?: string | GeoJsonType) {
        super();

        if (!json) {
            json = this.workspaceManager.getJSON(this.layer.xId);
        }

        const geoJson = new GeoJSON(json);

        this.crs = { type: 'name', properties: { name: this.layer.projectionId || this.layer.map.ProjectionId } };

        const crs = geoJson.featureCollection.crs;

        if (crs) {
            if (crs.type === 'name') {
                this.crs = { type: 'name', properties: { name: crs.properties.name === 'GoogleMapsCompatible' ? 'urn:ogc:def:crs:EPSG:3857' : crs.properties.name } };
            } else if (crs.type === 'link') {
                this.crs = { type: 'link', properties: { href: crs.properties.href, type: crs.properties.type } };
            }
        } else {
            const translate = TranslateList.getItem(this.layer.projectionId || this.layer.map.ProjectionId);
            if (translate) {
                this.crs = { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG:' + translate.EpsgCode } };
            }
        }

        this.layer.options.tilematrixset = this.projectionId;

        for (let featureIndex = 0, currentFeature; (currentFeature = geoJson.featureCollection.getFeature(featureIndex)); featureIndex++) {
            const mapObject = MapObject.fromJSON(this.layer, currentFeature.toJSON());
            if (!mapObject.styles) {
                // для рисования обычного GeoJSON
                const stroke = Stroke.fromSVG({
                    'stroke': 'green',
                    'stroke-opacity': 0.75,
                    'stroke-width': '2px',
                    'stroke-dasharray': 'none'
                });
                const fill = Fill.fromSVG({
                    'fill': 'blue',
                    'fill-opacity': 0.75
                });
                const marker = MarkerStyle.fromSVG({
                    'markerId': DEFAULT_SVG_MARKER_ID
                });

                const text = new TextStyle();

                mapObject.addStyle(new Style({ stroke, fill, marker, text }));
            }
            if (mapObject.newFlag) {
                mapObject.objectNumber = featureIndex + 1;
            }

            this.objectStorage.addObject(mapObject);
        }

        this.workspaceManager.setJSON(this.layer.xId, this.toJson(), this.layer.isLocked);

    }

    destroy() {
        super.destroy();
        const jsonData = this.workspaceManager.getJSON(this.layer.xId);
        if (!this.layer.isLocked || jsonData?.features.length === 0) {
            this.workspaceManager.removeJSON(this.layer.xId);
        }
    }

    removeJsonData() {
        this.workspaceManager.removeJSON(this.layer.xId);
    }

    async commitFunction(mapObject: MapObject): Promise<CommitTransactionAnswer> {
        const result = await super.commitFunction(mapObject);

        this.workspaceManager.setJSON(this.layer.xId, this.toJson(), this.layer.isLocked);

        return result;
    }

    async commitTransactionFunction(): Promise<CommitTransactionAnswer> {
        const result = await super.commitTransactionFunction();

        this.workspaceManager.setJSON(this.layer.xId, this.toJson(), this.layer.isLocked);

        return result;
    }

    async reloadFunction(mapObject: MapObject): Promise<void> {

        const json = this.workspaceManager.getJSON(this.layer.xId);
        if (json) {
            const geoJson = new GeoJSON(json);
            for (let i = 0, feature; (feature = geoJson.featureCollection.getFeature(i)); i++) {
                if (feature.properties.id === mapObject.gmlId) {
                    const newMapObject = MapObject.fromJSON(mapObject.vectorLayer, feature.toJSON());
                    mapObject.updateFrom(newMapObject);
                    break;
                }
            }
        }

    }

    async reloadTransactionFunction(params: { geometry: boolean; properties: boolean; }): Promise<void> {
        if (this.transactionStorage.count > 0) {
            const json = this.workspaceManager.getJSON(this.layer.xId);
            if (json) {
                const geoJson = new GeoJSON(json);
                for (const mapObject of this.transactionStorage.iterator) {
                    for (let i = 0, feature; (feature = geoJson.featureCollection.getFeature(i)); i++) {
                        if (feature.properties.id === mapObject.gmlId) {
                            if (params.geometry && !params.properties) {
                                mapObject.updateGeometryFromJSON(feature.toJSON());
                            } else {
                                const newMapObject = MapObject.fromJSON(mapObject.vectorLayer, feature.toJSON());
                                mapObject.updateFrom(newMapObject);
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    private toJson(): GeoJsonType {
        const geoJson = new GeoJSON();
        geoJson.getOrigin().crs = this.crs;
        for (let mapObject of this.objectStorage.iterator) {
            geoJson.addFeature(mapObject.toJSON(true));
        }

        return geoJson.getOrigin();
    }

    /**
     * Скачать слой в формате GeoJSON
     * @method download
     */
    get blob() {
        const geoJson = new GeoJSON();
        geoJson.getOrigin().crs = this.crs;
        for (const mapObject of this.objectStorage.iterator) {
            geoJson.addFeature(mapObject.toJSON(true));
        }

        const json = geoJson.toString();
        return new Blob([json], { type: 'application/octet-stream' });
    }


    requestGeometry(mapbject:MapObject): Promise<GeoJsonType|undefined> {
        return Promise.resolve(undefined);
    }

}
