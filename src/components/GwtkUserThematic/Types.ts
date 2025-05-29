import { FeatureType } from '~/utils/GeoJSON';
import { Cell } from '~/services/Utils/CsvEditor';
import MapObject from '~/mapobject/MapObject';
import { BuildParameterOptions } from '~/types/Types';

export enum CartogramSource {
    File,
    Layer
}

export interface Delimiter {
    id: number;
    name: string;
    cols: number;
}

export type Semantic = {
    name: string;
    type: string;
    index: number;
}

export interface LayerItem {
    alias: string;
    id: string;
    keylist?: string; // список ключей через запятую
    semlink: string;
    semlinkname: string;
    features: MapObject[],
    featuresSelected: MapObject[],
    objectSemanticList: Cell[];
}

export interface ThematicProjectSettings {
    name: string,
    serviceUrl: string,
    idLayer: string,
    virtualFolder: { alias: string; folder: string; },

    cartogramSource: CartogramSource,

    fileName?: string,

    bySelectedObjects: boolean,
    featuresSelected: FeatureType[],

    delimiterId: number,
    hasTitleLine: boolean,
    semanticDataLinkColumn: number,

    buildParameterOptionsList: BuildParameterOptions[];
}