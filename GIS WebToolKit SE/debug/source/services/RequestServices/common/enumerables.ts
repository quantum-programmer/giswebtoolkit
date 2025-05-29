/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Перечисляемые типы для запросов                 *
 *                                                                  *
 *******************************************************************/

export enum AREA {
    RemoveArea = '0',
    AddArea = '1'
}

export enum BYXSD_VALUE {
    ByLayer = '0',
    ByScheme = '1'
}


export enum CIRCLE {
    RoundedCorners = '1',
    SharpCorners = '0'
}

export enum CUTBYFRAME {
    ShouldCut = '1',
    Uncut = '0'
}

export enum SORTTYPE {
    SortByLayerName = 'SORTBYLAYERNAME',
    SortByObjectName = 'SORTBYOBJECTNAME',
    SortBysemanticValue = 'SORTBYSEMANTICVALUE',
    FindDirection = 'FINDDIRECTION'
}

export enum FINDDIRECTION {
    FirstObjectFirst = '0',
    FirstObjectLast = '1'
}

export enum GETFRAME {
    AddObjectBounds = '1',
    RemoveObjectBounds = '0'
}

export enum GETID {
    RemoveGmlId = '0',
    AddGmlId = '1'
}

export enum INMAP {
    WithoutRelief = '0',
    WithRelief = '1'
}

export enum LENGTH {
    RemoveLength = '0',
    AddLength = '1'
}

export enum METRIC {
    RemoveMetric = '0',
    AddMetric = '1'
}

export enum OBJCENTER {
    ObjectCenter = '1',
    FirstPoint = '2'
}

export enum OUTTYPE {
    JSON = 'JSON',
    GML = 'GML',
    WFS = 'WFS',
    SXF = 'SXF',
    TXF = 'TXF',
    CSV = 'CSV',
    SITX = 'SITX',
    MTQ = 'MTQ',
    SHP = 'SHP',
    TAB = 'TAB',
    KML = 'KML',
    MIF = 'MIF',
    DWG = 'DWG',
    DXF = 'DXF'
}

export enum CROSSTYPE {
    Undefined,
    MainInside,
    Inside,
    Cross,
    NotCross,
    CrossInsideList,
    CrossOutSideList
}

export enum SEMANTIC {
    RemoveSemantic = '0',
    AddSemantic = '1'
}

export enum SEVERALOBJ {
    UnionZons = '0',
    SplitZones = '1'
}

export enum VIRTUALFOLDER {
    ForCurrentUser = '0',
    ForAllUsers = '1'
}

export enum LATLONG {
    LongitudeLatitude = '0',
    LatitudeLongitude = '1'
}

export enum UploadAction {
    Delete = 'delete',
    Upload = 'upload'
}
