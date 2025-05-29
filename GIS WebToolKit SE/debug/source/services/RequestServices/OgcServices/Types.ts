/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Типы параметров для OGC запросов                  *
 *                                                                  *
 *******************************************************************/

import {
    OUTTYPE,
    OBJCENTER,
    CUTBYFRAME,
    GETFRAME,
    FINDDIRECTION,
    GETID,
    AREA,
    SEMANTIC,
    LENGTH,
    INMAP
} from '~/services/RequestServices/common/enumerables';

export type DescribeCoverage = {
    SERVICE: 'WCS';
    REQUEST: 'DescribeCoverage';
    COVERAGEID: string;
}
export type DescribeCoverageUser = {
    COVERAGEID: string;
    VERSION?: '2.0.1';
    EPSGLIST?: string;
}

export type DescribeFeatureTypes = {
    SERVICE: 'WFS';
    REQUEST: 'DescribeFeatureType';
}
export type DescribeFeatureTypesUser = {
    TYPENAMES?: string;
    LAYER_ID?: string;
}

export type GetCapabilitiesWcs = {
    SERVICE: 'WCS';
    REQUEST: 'GetCapabilities'
}
export type GetCapabilitiesWcsUser = {
    VERSION?: '2.0.1';
    FORMAT?: 'text/xml'
}

export type GetCapabilitiesWfs = {
    SERVICE: 'WFS';
    REQUEST: 'GetCapabilities'
}
export type GetCapabilitiesWfsUser = {
    OUTPUTFORMAT?: 'application/gml+xml; version=3.2';
    ACCSEPTVERSION?: '2.0.0';
    LAYER_ID?: string;
}

export type GetCapabilitiesWms = {
    SERVICE: 'WMS';
    REQUEST: 'GetCapabilities'
}
export type GetCapabilitiesWmsUser = GetCapabilitiesWcsUser;

export type GetCapabilitiesWmts = {
    SERVICE: 'WMTS';
    REQUEST: 'GetCapabilities'
}
export type GetCapabilitiesWmtsUser = {
    VERSION?: '1.0.0';
    FORMAT?: 'text/xml'
}

export type GetCoverage = {
    SERVICE: 'WCS';
    REQUEST: 'GetCoverage';
    COVERAGEID: string;
}
export type GetCoverageUser = {
    COVERAGEID: string;
    VERSION?: '2.0.1';
    FORMAT?: string;
    RESOLUTION?: string;
    DIMENSIONSUBSETX?: string;
    DIMENSIONSUBSETY?: string;
}

export type GetFeature = {
    SERVICE: 'WFS';
    REQUEST: 'GETFEATURE';

    TYPENAMES?: string;
    STOREDQUERY_ID?: string;
    ID?: string;
    SRSNAME?: string;
    BBOX?: string;
    COUNT?: string;
    STARTINDEX?: string;
    RESULTTYPE?: 'results' | 'hits';
    LAYER_ID?: string;
    FINDDIRECTION?: FINDDIRECTION;
}
export type GetFeatureUser = {
    TYPENAMES?: string;
    STOREDQUERY_ID?: string;
    ID?: string;
    SRSNAME?: string;
    BBOX?: string;
    COUNT?: string;
    STARTINDEX?: string;
    RESULTTYPE?: 'results' | 'hits';
    LAYER_ID?: string;

    MAPID?: '1';

    METRIC?: '1';
    SEMANTIC?: '1';
    SCALERANGE?: '1';
    OBJLOCAL?: string;
    IDLIST?: string;
    CODELIST?: string;
    OUTTYPE?: OUTTYPE;
    OBJCENTER?: OBJCENTER;
    CUTBYFRAME?: CUTBYFRAME;
    TILEMATRIXSET?: string;
    TILEMATRIX?: string;
    TILEROW?: string;
    TILECOL?: string;
    GETFRAME?: GETFRAME;
    OBJECTVIEWSCALE?: string;
    GETHEIGHT?: '1';
    GETGRAPHOBJECTS?: '1' | '0';
    GETKEY?: '1';
    SEMANTICNAME?: '1';
    LAYERSEMANTICSEARCH?: '1';

    MEASUREINMAP?: '1';
    INMAP?: '1';
    LENGTH?: LENGTH;
    AREA?: AREA;
    AREAPIXEL?: string;

    KEYLIST?: string;
    SERVICEVERSION?: string;
    CheckObjectMiddleByFrame?: '1';

    TEXTFILTER?: string;
    LATLONG?: '1';
    OUTCRS?: string;
    FINDDIRECTION?: FINDDIRECTION;
    PROPERTYNAME?: string;
    GETSLD?: '1';
    NOLAYERMETADATA?: '1';
    NOHEIGHTCOORDINATE?: '1';
    SCHEMANAME?: string;

}

export type GetFeatureInfoWms = {
    SERVICE: 'WMS';
    REQUEST: 'GetFeatureInfo';
    VERSION: '1.3.0';
    LAYERS: string;
    STYLES?: string;
    CRS: string;
    BBOX: string;
    WIDTH: string;
    HEIGHT: string;
    FORMAT: string;
}
export type GetFeatureInfoWmsUser = {
    LAYERS: string;
    STYLES?: string;
    CRS: string;
    BBOX: string;
    WIDTH: string;
    HEIGHT: string;
    FORMAT: string;

    QUERY_LAYERS?: string;
    INFO_FORMAT?: string;
    FEATURE_COUNT?: string;
    I?: string;
    J?: string;
    APIKEY?: string;
    GETID?: GETID;
    AREA?: AREA;
    SEMANTIC?: SEMANTIC;
    LENGTH?: LENGTH;
    OBJLOCAL?: string;
    INMAP?: INMAP;
    TYPENAMES?: string;
    IDLIST?: string;
    CODELIST?: string;
    NOPAINTERROR?: '1';
    KEYLIST?: string;
    TEXTFILTER?: string;
    GETGRAPHOBJECTS?: '1';
    LATLONG?: '1';

    OUTCRS?: string;
    FINDDIRECTION?: FINDDIRECTION;
    PROPERTYNAME?: string;
    GETSLD?: '1';
    NOLAYERMETADATA?: '1';
    NOHEIGHTCOORDINATE?: '1';
    SCHEMANAME?: string;
}

export type GetFeatureInfoWmts = {
    SERVICE: 'WMTS';
    REQUEST: 'GetFeatureInfo';
    LAYER: string;
    STYLE?: string;
    FORMAT: string;
    TILEMATRIXSET: string;
    TILEMATRIX: string;
    TILEROW: string;
    TILECOL: string;
    VERSION: '1.0.0';
}
export type GetFeatureInfoWmtsUser = {
    LAYER: string;
    STYLE?: string;
    FORMAT: string;
    TILEMATRIXSET: string;
    TILEMATRIX: string;
    TILEROW: string;
    TILECOL: string;

    INFO_FORMAT?: string;
    FEATURE_COUNT?: string;
    I?: string;
    J?: string;
    GETID?: GETID;
    AREA?: AREA;
    SEMANTIC?: SEMANTIC;
    LENGTH?: LENGTH;
    OBJLOCAL?: string;
    INMAP?: INMAP;
    TYPENAMES?: string;
    IDLIST?: string;
    CODELIST?: string;
    NOPAINTERROR?: '1';
    KEYLIST?: string;
    TEXTFILTER?: string;
    GETGRAPHOBJECTS?: '1';
    LATLONG?: '1';
    FINDDIRECTION?: FINDDIRECTION;
    PROPERTYNAME?: string;
    GETSLD?: '1';
    NOLAYERMETADATA?: '1';
    NOHEIGHTCOORDINATE?: '1';
    SCHEMANAME?: string;
    OUTCRS?: string;
}

export type GetMap = {
    SERVICE: 'WMS';
    REQUEST: 'GetMap';
    VERSION: '1.3.0';
    LAYERS: string;
    STYLES?: string;
    CRS: string;
    BBOX: string;
    WIDTH: string;
    HEIGHT: string;
    FORMAT: string;
}
export type GetMapUser = {
    LAYERS: string;
    STYLES?: string;
    CRS: string;
    BBOX: string;
    WIDTH: string;
    HEIGHT: string;
    FORMAT: string;

    APIKEY?: string;
    EXCEPTOINS?: string;
    VERSION?: '1.3.0';
    TYPENAMES?: string;
    IDLIST?: string;
    CODELIST?: string;
    NOPAINTERROR?: '1';
    KEYLIST?: string;
    TEXTFILTER?: string;
    GETGRAPHOBJECTS?: '1';
    OBJLOCAL?: string;
    LATLONG?: '1';
    TRANSPARENT?: string;
}

export type GetTile = {
    SERVICE: 'WMTS';
    REQUEST: 'GetTile';
    VERSION: '1.0.0';
    LAYER: string;
    STYLE?: string;
    FORMAT: string;
    TILEMATRIXSET: string;
    TILEMATRIX: string;
    TILEROW: string;
    TILECOL: string;
}
export type GetTileUser = {
    LAYER: string;
    STYLE?: string;
    FORMAT: string;
    TILEMATRIXSET: string;
    TILEMATRIX: string;
    TILEROW: string;
    TILECOL: string;

    NOPAINTERROR?: '1';

    TYPENAMES?: string;
    IDLIST?: string;
    CODELIST?: string;
    KEYLIST?: string;
    TEXTFILTER?: string;
    GETGRAPHOBJECTS?: '1';
    OBJLOCAL?: string;
    LATLONG?: '1';
    TRANSPARENT?: string;
    EXCEPTOINS?: string;
}

export type ListStoredQueries = {
    SERVICE: 'WFS';
    REQUEST: 'ListStoredQueries';
}
export type ListStoredQueriesUser = {
    SERVICE: 'WFS';
    LAYER_ID?: string;
}

export type Transaction = {
    SERVICE: 'WFS';
    REQUEST: 'Transaction';
}
export type TransactionUser = {
    LAYER_ID?: string;
    ListName?: string;
}
