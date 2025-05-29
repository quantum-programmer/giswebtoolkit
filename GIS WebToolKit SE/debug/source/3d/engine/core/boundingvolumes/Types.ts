/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Общие типы для ограничивающих объемов               *
 *                                                                  *
 *******************************************************************/

import { Vector3D } from '~/3d/engine/core/Types';

export type CommonBoundingVolume3DSerialized<T = Vector3D> = {
    points: T[];
};


export type AdditionalOrientedVolumeSerializedProperties = {
    xAxis?: Vector3D;
    yAxis?: Vector3D;
    zAxis?: Vector3D;
};


export type BoundingVolume3DSerialized = CommonBoundingVolume3DSerialized & AdditionalOrientedVolumeSerializedProperties;
