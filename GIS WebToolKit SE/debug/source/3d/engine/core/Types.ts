/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Общие типы для ядра                      *
 *                                                                  *
 *******************************************************************/

import { SimpleJson } from '~/types/CommonTypes';

export type Vector1D = [number];
export type Vector2D = [number, number];
export type Vector3D = [number, number, number];
export type Vector4D = [number, number, number, number];

export type AnyVector = Vector1D | Vector2D | Vector3D | Vector4D;

export type Vector2or3 = Vector2D | Vector3D;

export type Matrix2x2 = [
    number, number,
    number, number
];

export type Matrix3x3 = [
    number, number, number,
    number, number, number,
    number, number, number
];

export type Matrix4x4 = [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
];

export type BufferDescription = {
    startIndex: number;
    count: number;
};

export type AttributesArrayBufferDescription = {
    startByte: number;
    byteLength: number;
    stride: number;
    offsets: SimpleJson<number>;
};

export type IndicesArrayBufferDescription = {
    startByte: number;
    byteLength: number;
};
