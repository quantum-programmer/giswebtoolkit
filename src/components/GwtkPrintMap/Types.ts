import GeoPoint from '~/geo/GeoPoint';

export type Bounds = {
    left: number;
    top: number;
    width: number;
    height: number;
}

export type BoundsGeo = {
    point1: GeoPoint,
    point2: GeoPoint
}

export enum PrintItems {
    printer,
    filePng,
    fileJpg
}