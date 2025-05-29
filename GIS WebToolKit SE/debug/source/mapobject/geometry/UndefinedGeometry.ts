/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Неопределенная геометрия объекта карты              *
 *                                                                  *
 *******************************************************************/

import BaseMapObjectGeometry, {
    PointInfo,
    PointSelector,
    ContourSelector, ObjectSelector, NearestInterpolatedPointResult
} from '~/mapobject/geometry/BaseMapObjectGeometry';
import { MapPoint } from '~/geometry/MapPoint';
import { PointGeometryType } from '~/utils/GeoJSON';
import { Bounds } from '~/geometry/Bounds';
import { Vector2or3, Vector2D, Vector4D } from '~/3d/engine/core/Types';
import { vec2 } from '~/3d/engine/utils/glmatrix';
import XMLElement from '~/services/Utils/XMLElement';


const GEOMETRY_ERROR = Error( 'Undefined geometry' );

/**
 * Неопределенная геометрия объекта карты
 * @class UndefinedGeometry
 */
export default class UndefinedGeometry extends BaseMapObjectGeometry {

    equals( other: BaseMapObjectGeometry ): boolean {
        return false;
    }

    toJSON( targetProjectionId: string ): PointGeometryType | undefined {
        return;
    }

    fromJSON( json: PointGeometryType, sourceProjectionId: string, targetProjectionId: string ): void {
        throw GEOMETRY_ERROR;
    }

    addPoint( mapPoint: MapPoint ): void {
        throw GEOMETRY_ERROR;
    }

    checkHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        throw GEOMETRY_ERROR;
    }

    getBounds(): Bounds {
        throw GEOMETRY_ERROR;
    }

    checkPointHover( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        throw GEOMETRY_ERROR;
    }

    checkBorderHover( mapPoint: MapPoint, delta: number, selector?: PointInfo ): MapPoint | undefined {
        throw GEOMETRY_ERROR;
    }

    findNearestPointWithinRange( mapPoint: MapPoint, delta: number ): PointInfo | undefined {
        throw GEOMETRY_ERROR;
    }

    getPoint( pointSelector: PointSelector = {} ): MapPoint | undefined {
        throw GEOMETRY_ERROR;
    }

    updatePoint( mapPoint: MapPoint, selector: PointSelector ): void {
        throw GEOMETRY_ERROR;
    }

    removePoint( pointSelector: PointSelector ): void {
        throw GEOMETRY_ERROR;
    }

    removeLastPoint(): void {
        throw GEOMETRY_ERROR;
    }

    removeContour( contourSelector: ContourSelector ): void {
        throw GEOMETRY_ERROR;
    }

    removeObject( objectSelector: ObjectSelector ): void {
        throw GEOMETRY_ERROR;
    }

    clear(): void {
        throw GEOMETRY_ERROR;
    }

    removeLastContourPoint( contourSelector: ContourSelector = {} ): void {
        throw GEOMETRY_ERROR;
    }

    getPointList(): MapPoint[] {
        throw GEOMETRY_ERROR;
    }

    hasPoints(): boolean {
        throw GEOMETRY_ERROR;
    }

    getPointListForDrawing(): Vector2or3[] | Vector2or3[][] {
        throw GEOMETRY_ERROR;
    }

    updateFrom( other: BaseMapObjectGeometry ): void {
        return;
    }

    findNearestInterpolatedPoint( mapPoint: MapPoint, objectNumber = 0 ): NearestInterpolatedPointResult | undefined {
        throw GEOMETRY_ERROR;
    }

    rotate( angleValue: number, center = this.getCenter() ): void {
        throw GEOMETRY_ERROR;
    }

    scale( scale: Vector2D, center = this.getCenter() ): void {
        throw GEOMETRY_ERROR;
    }

    scaleByAxis( scale: Vector2D, center = this.getCenter(), axis = { x: vec2.UNITY, y: vec2.UNITX } ): void {
        throw GEOMETRY_ERROR;
    }

    move( move: { deltaX: number; deltaY: number } ): void {
        throw GEOMETRY_ERROR;
    }

    getOriginBounds( targetProjectionId: string, bounds?: Bounds ): Vector4D {
        return super.getOriginBounds( targetProjectionId, bounds );
    }

    getCenter(): MapPoint {
        throw GEOMETRY_ERROR;
    }

    closeObject(): boolean {
        throw GEOMETRY_ERROR;
    }

    getObjectContours( objectNumber: number ): MapPoint[][] | undefined {
        throw GEOMETRY_ERROR;
    }

    getContourPoints( objectNumber: number, contourNumber: number ): MapPoint[] {
        throw GEOMETRY_ERROR;
    }

    getObjectContoursCount( objectNumber: number ): number {
        throw GEOMETRY_ERROR;
    }

    addEmptyContour( objectNumber: number ): ContourSelector | undefined {
        throw GEOMETRY_ERROR;
    }

    getGmlPosList(): XMLElement | undefined {
        throw GEOMETRY_ERROR;
    }
}
