import {FeatureSemanticItem} from '~/utils/GeoJSON';
import {GwtkMap} from '~/types/Types';
import MapObject from '~/mapobject/MapObject';
import {
    ExportReportFeatureCollectionFormatted,
    ExportReportFeatureCollectionLayer, ExportReportFeatureCollectionMap
} from '../../../../service/GISWebServerSEService/Types';
import {SimpleJson} from '~/types/CommonTypes';

export class FeaturesFormatter {

    private readonly map: GwtkMap;

    protected formatted: ExportReportFeatureCollectionFormatted = {};

    constructor(map: GwtkMap) {
        this.map = map;
    }

    formatFeatures(features: MapObject[]): ExportReportFeatureCollectionFormatted {
        features.forEach(feature => {
            if (feature.mapId && feature.layerId && feature.layerName && feature.getSemantics().length) {
                this.setFeatureToMap(feature);
            }
        });
        return this.formatted;
    }

    protected setFeatureToMap(feature: MapObject): void {
        const mapId = feature.mapId as string;
        if (!this.formatted[mapId]) {
            this.addMap(mapId);
        }
        this.setFeatureToLayer(feature, this.formatted[mapId]);
    }

    protected addMap(mapId: string): void {
        const mapName = this.map.tiles.getLayerByIdService(mapId)?.alias || mapId.toString();
        this.formatted[mapId] = {
            mapName: mapName,
            layers: {}
        };
    }

    protected setFeatureToLayer(feature: MapObject, map: ExportReportFeatureCollectionMap): void {
        const layerId = feature.layerId as string;
        const layerName = feature.layerName as string;
        const semantics = feature.getSemantics();

        if (!map.layers[layerId]) {
            this.addLayer(layerId, layerName, semantics, map.layers);
        }
        this.addFeature(feature, map.layers[layerId]);
    }

    protected addLayer(layerId: string, layerName: string, semantics: FeatureSemanticItem[], layers: ExportReportFeatureCollectionMap['layers']): void {
        const entries = semantics.map(semantic => [semantic.key, semantic.name]);
        const headers = Object.assign({
            id: 'N'
        }, Object.fromEntries(entries));
        layers[layerId] = {
            layerName: layerName,
            headers: headers,
            items: []
        };
    }

    protected addFeature(feature: MapObject, layer: ExportReportFeatureCollectionLayer): void {
        const entries = feature.getSemantics().map(semantic => [semantic.key, semantic.value]);
        const featureData: SimpleJson = Object.assign({
            id: feature.objectNumber
        }, Object.fromEntries(entries));
        layer.items.push(featureData);
    }

}
