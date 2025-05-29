/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Типы для REST запросов                       *
 *                                                                  *
 *******************************************************************/

import {
    OUTTYPE,
    OBJCENTER,
    CUTBYFRAME,
    GETFRAME,
    FINDDIRECTION,
    BYXSD_VALUE,
    VIRTUALFOLDER,
    CIRCLE,
    SEVERALOBJ,
    LATLONG,
    METRIC,
    UploadAction
} from '~/services/RequestServices/common/enumerables';
import { SimpleJson, ContainsSomeOf } from '~/types/CommonTypes';
import { GeoJsonType } from '~/utils/GeoJSON';
import { Vector2D, Vector3D } from '~/3d/engine/core/Types';
import { TranslateDescription } from '~/translate/Types';
import GwtkError from '~/utils/GwtkError';


export type FileByLinkParams = {
    ALIAS: string;
    LAYER: string;
    OUTTYPE?: string;
}
export type BuildZoneParams = {
    RADIUS: string;
    LAYER: string;
    IDLIST: string;

    SERVICE?: 'WFS';
    CIRCLE?: CIRCLE;
    SEVERALOBJ?: SEVERALOBJ;
    OUTTYPE?: string;
    CRS?: string;
}

export type ReliefProfileParams = {
    LAYER: string;
    PRECISION: string;
    FILEDATA?: string;
    OUTTYPE?: string;
}

export type ReliefProfileResponse = {
    restmethod: {
        outparams: [
            {
                name: 'Count',
                value: number;
                type: 'string'
            },
            {
                name: 'Result';
                value: Vector3D[] | Vector3D[][];
                type: 'string';
            },
            {
                name: 'Length',
                value: number;
                type: 'string';
            },
            {
                name: 'LengthByRelief',
                value: number;
                type: 'string';
            },
            {
                name: 'prescisionList';
                value: number[];
                type: 'array';
            }
        ];
    }
}

export type BuildHeatMapParams = {
    LAYER: string;
    RADIUS: string;
    ELEMSIZE: string;
    EXCODES: string;
    ALIAS?: string;
    PALETTE?: string;
    PALETTECOUNT?: string;
}

export type BuildHeatMapResponse = {
    restmethod: {
        createlayerlist: {
            alias: string;
            id: string;
        }[];
        outparams: {
            name: 'Result',
            value: '1' | '0',
            type: 'string'
        }[];
    }
}

type CommonRestGmlJsonParams = {
    REQUESTID?: string;
    BBOX?: string;
    //     CRS=EPSG:4326 Код системы координат по классификации EPSG
    TYPENAMES?: string;
    COUNT?: string;
    STARTINDEX?: string;
    RESULTTYPE?: 'results' | 'hits';
    METRIC?: METRIC;
    AREA?: '1';
    SEMANTIC?: '0' | '1';
    LENGTH?: '1';
    OBJCENTER?: OBJCENTER;
    SCALERANGE?: '1';
    IDLIST?: string;
    CODELIST?: string;
    GETFRAME?: GETFRAME;
    MAPID?: '1';
    OUTTYPE?: OUTTYPE;
    INMAP?: '1';
    OBJECTVIEWSCALE?: string;
    ONLYID?: '0' | '1';
    MULTYLEVELGEOMETRY?: string;
    GETHEIGHT?: '1';
    GETGRAPHOBJECTS?: '0' | '1';
    GETKEY?: '0' | '1';
    SEMANTICNAME?: '0' | '1';
    LAYERSEMANTICSEARCH?: '1';
    FILESEMANTICLINK?: '0' | '1';
    SEMANTICCODE?: '0' | '1';
    VERSION?: string;

    //     Расчет площади, периметра и длины объекта (устанавливается один из перечисленных ниже
    //     параметров):
    //     MEASUREINMAP=1 Вывод информации по базовой проекции карты
    //     INMAP=1 Вывод информации с учетом рельефа местности
    //     LENGTH=1 Длина или периметр объекта с уточнением параметров
    //     по эллипсоиду
    //     AREA=1 Площадь объекта с уточнением параметров по
    //     эллипсоиду
    //     AREAPIXEL=5 Радиус поиска в пикселях (по умолчанию 5)
    //     AREAMETRS=1.1 Радиус поиска в метрах (по умолчанию 5)
    //     KEYLIST=L100000001 Список ключей
    //     OUTCRS=EPSG:4326 Формат выводимых координат (указывается код
    //     системы координат по классификации EPSG).
    //     GETSTYLE=1 Вывод стилей для объектов.
    //         NOCACHE=1 Выключить кэширование данных на сервере
    //     LATLONG=1 Порядок следования координат (широта/долгота или
    //     долгота/широта)
    //     OBJLOCAL=0,2 Локализация объекта (0 – линейный, 1 – площадной, 2 –
    // точечный, 3 – подпись, 4 – векторный, 5 – шаблон)
    //     FINDDIRECTION=0 Вывода порядка следования объектов, 0 – начиная с
    //     первого, 1 – начиная с последнего
    //     PROPERTYNAME=Settlemen Список ключей семантик для вывода
    //     GETSLD=1 Вывод графического описания вида объектов на основе
    //     стандарта OGC StyledLayerDescriptor
    //     NOLAYERMETADATA=1 Не выводить метаданные по слою (имя, слой, схему,
    //         код объекта и другие)
    //     NOHEIGHTCOORDINATE=1 Не выводить высоту в метрике объекта
    //     SCHEMANAME=200t05g Идентификатор схемы для фильтрации результата
    //     GETEMPTYCLUSTEROBJECT=1 Вывод пустого объекта, объединяющего объекты кластера.
}


export type CreateLegendParams = {
    LAYER: string;
    SERVICE?: 'WFS';
    TYPENAMES?: string;
    OBJLOCAL?: string;
    WIDTH?: '16' | '32' | '48' | '64' | '96';
    BYXSD?: BYXSD_VALUE;
    COLOR?: string;
    UPDATE?: '1';
    INMAP?: '1';
    KEYLIST?: string;
}

export type Get3dMaterialsParams = {
    LAYER: string;
    ZOOM: string;
    MATERIALID: string;
}

export type Get3dObjectsByClassifierParams = Get3dObjectsCommonParams & { CLASSIFIERNAME: string; };

export type Get3dObjectsCommonParams = {
    CODELIST?: string;
    OBJLOCAL?: string;
    KEYLIST: string;
    SERVICEVERSION: string;
    GETTEXTURES?: '0' | '1';
    GETOBJECTS?: '0' | '1';
    LEVELLIST?: string;
}

export type LayerParam = {
    LAYER: string;
}

export type Get3dObjectsParams = Get3dObjectsCommonParams & LayerParam;

export type Get3dTexturesParams = {
    LAYER: string;
    ZOOM: string;
    TEXTUREID: string;
}


export type Get3dTilesParams = {
    LAYER: string;
    ZOOM: string;
    MINCOL: string;
    MAXCOL: string;
    MINROW: string;
    MAXROW: string;
}

export type GetAreaParams = {
    LAYER?: string;
    getLineLengthBetweenPoint?: string;
}

export type CalculateLengthResponse = {
    perimeter: number;
    linesLength: number[];
}

export type CreateProcessResponse = {
    restmethod: {
        outparams: {
            jobId: string;
            percentCompleted: number;
            status: 'Accepted' | 'Running' | 'Dismissed'
        }
    }
}

export type GetRequestDataParams = {
    PROCESSNUMBER?: string;
}

export type GetRequestDataResponse = {
    restmethod: {
        outparams: ({
            name: 'ProcessNotFound';
            value: '-1';
            type: 'string';
        } | {
            name: 'Percent';
            value: string;
            type: 'string';
        })[];
    }
}

export type CheckKeyParams = {
    Program: string;
}

export type CheckKeyResponse = string;

export type DismissParams = {
    jobId?: string;
    outtype?: OUTTYPE;
    serviceversion?: string;
}

export type DismissResponse = {
    restmethod: {
        outparams: {
            jobId: string;
            status: 'Dismissed'
        }
    }
}

export type GetStatusDataResponse = {
    restmethod: {
        outparams: ({
            estimatedCompletion: string;
            expirationDate: string;
            jobId: string;
            percentCompleted: number;
            status: 'Succeeded' | 'Accepted' | 'Running' | 'Failed'
        });
    }
}


export type GetLoadDataResponse = {
    restmethod: {
        createlayerlist:
            {
                alias: string;
                id: string;
                xsdschema?: string;
            }[];
        outparams:
            {
                xsdname: string;
                boundingbox: string;
            }
    }
}


export type GetSheetNameParams = {
    LAYER?: string;
}

export type GetSheetNameResponse = {
    restmethod: {
        outparams: {
            name: string;
            value: string;
            type: 'string'
        }[];
    }
}

export type GetAreaResponse = GeoJsonType;

export type GetCoverageTileParams = {
    LAYER: string;
    TILEMATRIXSET: string;
    TILEROW: string;
    TILECOL: string;
    TILEMATRIX: string;
}

export type GetCoverageTilesHeaderParams = {
    LAYER: string;
    TILEMATRIXSET: string;
}

export type GetFeatureCachedParams = {
    TILEMATRIX: string;
    TILEROW: string;
    TILECOL: string;
    LAYER: string;
    CUTBYFRAME: CUTBYFRAME;
}

export type GetFeatureParams = {
    LAYER: string;
    STOREDQUERY_ID?: string;
    ID?: string;
    SRSNAME?: string;
    OBJLOCAL?: string;
    CUTBYFRAME?: CUTBYFRAME;
    TILEMATRIXSET?: string;
    TILEMATRIX?: string;
    TILEROW?: string;
    TILECOL?: string;
    FINDINPOINT?: '1';

    SEMLIST?: string;
    SORTBYLAYERNAME?: FINDDIRECTION;
    SORTBYOBJECTNAME?: FINDDIRECTION;
    SORTBYSEMANTICVALUE?: FINDDIRECTION;
    SEMSORTKEY?: string;
    MEASUREINMAP?: '1';
    AREAPIXEL?: string;
    KEYLIST?: string;
    SERVICEVERSION?: string;
    CheckObjectMiddleByFrame?: '1';
    TEXTFILTER?: string | SimpleJson<any>;
    LATLONG?: LATLONG;  //1 - широта,долгота; 0 - долгота,широта
    OUTCRS?: string;
    FINDDIRECTION?: FINDDIRECTION;
    PROPERTYNAME?: string;
    GETSLD?: '0' | '1';
    NOLAYERMETADATA?: '1';
    NOHEIGHTCOORDINATE?: '0' | '1';
    SCHEMANAME?: string;
    GETSTATISTICS?: '1';
    CROSSMETHOD?: string;
    FILEDATA?: string | SimpleJson<any>;
    IDLIST?: string;
    NOFILELINK?: '1';
    GETEMPTYCLUSTEROBJECT?: '0' | '1';
    SORTBYSEMANTICUSERCODE?: '1';
    MEASUREFILTER?: string | SimpleJson<any>;
    STRINGFORSEARCHINRESULT?: string;
} & CommonRestGmlJsonParams;


export type GetFeatureCountResponse = {
    restmethod: {
        outparams: {
            NumberMatched: number;
        }
    }
}

export type GetFileParams = {
    FILEPATH: string;
    SERVICE?: string;
    RENAME?: string;
}

export type GetFileFromSemanticParam = {
    LAYER: string,
    ALIAS: string,
    OUTTYPE?: string
}

export type GetFileFromSemanticResponse = {
    restmethod: {
        outparams: { value: string; }[];
    }
}

export type RscSemantic = {
    code: string;
    decimal: string;
    defaultvalue: string;
    enable: '1' | '2' | '3'; //Допустимая (1), обязательная (2), влияет на вид объекта (3)
    maximum: string;
    minimum: string;
    name: string;
    reply: string;
    service: string;
    shortname: string;
    size: string;
    textvalue?: string;
    type: string;
    unit: string;
    value?: string;
};

export type RscObject = {
    bot: string;
    code: string;
    direct: string;
    key: string;
    local: string;
    name: string;
    scale: string;
    segment: string;
    top: string;
    rscsemantics: RscSemantic[];
}

export type GetLayerSemanticListParams = {
    LAYER: string;
    CODELIST?: string;
    INMAP?: '1';
    TYPENAMES?: string;
}

export type GetLayerSemanticListResponse = {
    message: string;
    restcode: string;
    restmethod: 'GetLayerSemanticList';
    features: {
        alias: string;
        name: string;
        rscsemantic: RscSemantic[];
    }[]
};

export type GetSemByObjKeyParams = {
    LAYER: string;
    OBJECTKEY: string;
}

export type GetSemByObjKeyResponse = {
    message: string;
    restcode: string;
    restmethod: 'GetSemByObjKey';
    rscobject: RscObject;
};

export type GetSemanticWithListParams = {
    LAYER: string;
}

export type GetSemanticWithListResponse = {
    message: string;
    restcode: string;
    restmethod: 'GetSemanticWithList';
    classifiersematiclist: {
        code: string;
        key: string;
        reference: {
            name: string;
            text: string;
            value: string;
        }[];
    }[];
};

export type GetLayerStateParams = {
    LAYER: string;
    OUTTYPE?: OUTTYPE;
}

export type GetLayerStateResponse = {
    restmethod: {
        outparams: {
            name: string;
            value: string;
            type: string;
        }[]
    }
};


export type GetMapImageParams = {
    LAYER: string;
    CRS: string;
    BBOX: string;
    WIDTH: string;
    HEIGHT: string;
    FORMAT: string;

    STYLES?: string;
    EXCEPTOINS?: string;
    VERSION?: string;
    TYPENAMES?: string;
    IDLIST?: string;
    CODELIST?: string;
    NOPAINTERROR?: '1';
    DPI?: string;
    KEYLIST?: string;
    TEXTFILTER?: string;
    GETGRAPHOBJECTS?: '1';
    OBJLOCAL?: string;
    LATLONG?: '1';
    TRANSPARENT?: string;
    ONLYSELECTOBJECTS?: '1';
    COLOR?: string;
    OBJECTVIEWSCALE?: string;
}

export type GetScenarioParams = {
    LAYER: string;
    OUTTYPE?: OUTTYPE;
}

export type GetTrackParams = {
    LAYER: string;
    FILENAME: string;
}
export type LastActionParams = {
    LAYER: string;
}
export type UnionParams = {
    LAYER: string;
    IDLIST: string;
    OUTTYPE: OUTTYPE;
    PRECISION?: string;
    OUTCRS?: string;
}

export type LoadGmlByXsdParams = {
    XSDNAME: string;

    CRS?: string;
    LAYER?: string;
    WRITELOG?: '0' | '1';
    VIRTUALFOLDER?: VIRTUALFOLDER;
    GMLFILENAME?: string;
    SAVEDPATH?: string;
    CREATEMAPSCALE?: string;
}

export type MathBuildCrossLayersParams = {
    LAYERNAME1: string;
    LAYERNAME2: string;

    TYPENAMES1?: string;
    TYPENAMES2?: string;
    SEMANTICLIST1?: string;
    SEMANTICLIST2?: string;
} & CommonRestGmlJsonParams;

export type CheckCrossByLayersIncludePointsParams = ({
    LAYER: '';
    CROSSFILTERLIST: string;
} | {
    LAYER: string;
    IDINOBJECTLIST: string;
    IDLIST: string;
}) & CommonRestGmlJsonParams;

export type CheckDistanceByLayers = ({
    LAYER: '';
    DISTANCE: string;
    CONDITION: string;
} | {
    LAYER: string;
    IDINOBJECTLIST: string;
    IDLIST: string;
}) & CommonRestGmlJsonParams;

export type CheckFromStartByLayers = {
    LAYER: string;
    IDINOBJECTLIST?: string;
} | CommonRestGmlJsonParams;

export type CheckFromEndByLayers = {
    LAYER: string;
    IDINOBJECTLIST?: string;
} | CommonRestGmlJsonParams;

export type LoadData = {
    XSDNAME: string;
    SERVICEVERSION?: string;
    CRS?: string;
    CREATEMAPSCALE: string;
    LAYERNAME: string;
    EXTENSION?: string;
    WRITELOG?: '0' | '1';
    SAVEDPATH?: string;
    FILENAME: string;
    DELIMITERSYMBOL?: string
};

export type CopyMap = {
    LAYER: string;
    LAYERNAME?: string;
    VIRTUALFOLDER?: '1' | '0';
    SAVEDPATH: string;
    LAYERLIFETIME?: string;
};

export type CrossResultOperators =
    'MainInside'
    | 'Inside'
    | 'Cross'
    | 'NotCross'
    | 'CrossInsideList'
    | 'CrossOutSideList';

type CrossResult = ContainsSomeOf<{
    [operator in CrossResultOperators]: {
        layer: string;
        idList: string[];
    }[]
}>

export type CheckCrossByLayersIncludePointsResponse = {
    restmethod: {
        outparams: {
            [key: string]: CrossResult;
        }
    }
}
export type CheckDistanceByLayersIncludePointsResponse = {
    type: string;
    properties: {
        numberMatched: number
        numberReturned: number
    };
    bbox: number[];
    features: {
        type: string;
        geometry: string;
        properties: {
            id: string;
            code: number;
            layer: string;
            layerid: string;
            schema: string;
            name: string;
            osm_id?: string;
            building?: string;
            addr_e_city?: string;
            addr_e_street?: string;
            building_e_levels?: string;
            addr_e_housenumber?: string;
            addr_e_postcode?: string;
            building_rsc?: string;
            graphic?: string;
            ConstrDensity?: string;
            ObjState?: string;
        };
    }[];
}

export type ErrorResponse = {
    ExceptionReport: {
        code: string;
        locator: string;
        text: string;
        description: string;
    }
};


export type SideLengthParams = {
    LAYER: string;
    POINT1: string;
    POINT2: string;
    SERVICE?: 'WFS';
    CRS?: string;
    HANDLE?: string;
}


export type TextSearchParams = {
    LAYER: string;
    TEXTFILTER?: string;
} & CommonRestGmlJsonParams;

export type Transaction = {
    SERVICE: 'WFS';
    REQUEST: 'Transaction';
}

export type BuildFloodZoneParams = {
    LAYER: string;
    IDLIST: string;
    FLOOD: string;
    POINT1: string;
    POINT2: string;
    COVERAGEID: string;
    H1: string;
    H2: string;
    OUTTYPE?: OUTTYPE;
    SERVICEVERSION?: string;
    SAVEPATH?: string;
    CRS?: string;
}

export type BuildFloodZoneResponse = {
    restmethod: {
        createlayerlist: {
            alias: string;
            id: string;
            xsdschema: string;
        }[]
    }
}

export type JsonParamType = 'string' | 'base64' | 'bit' | 'i4' | 'json';

export interface JsonParam<T extends SimpleJson<any>> {
    name: keyof T;
    value: T[keyof T];
    type: JsonParamType;
}


export interface JsonRpcRequest<T extends SimpleJson<any>> {
    restmethod: {
        name: string;
        common?: JsonParam<T>[],
        layerlist?: { id: string; params?: JsonParam<T>[] }[];
        params?: JsonParam<T>[];
    };
}

export type SideAzimuthParams = {
    CalculateEpsg?: string;
    CRS?: string;
    LAYER?: string;
    POINT1: string;
    POINT2: string;
    OUTTYPE?: OUTTYPE;
}

export type SideAzimuthResponse = {
    restmethod: {
        outparams: [
            {
                name: 'SIDELENGTH';
                value: string;
                type: 'string';
            },
            {
                name: 'SIDEAZIMUTH';
                value: string;
                type: 'string'
            }
        ];
    }
}

export type AppendFileToObjectParams = {
    LAYER: string;
    ID: string;
    FILEPATH: string;
    OUTTYPE: string;
    NOTSAVEFILETOSEMANTIC?: string;
}

export type AppendFileToObjectResponse = {
    restmethod: {
        outparams: { value: string; }[];
    }
}

export type SaveFileToDocumentParams = {
    LAYER: string;
    SAVEDPATH?: string;
    FILETYPE?: string;
    FILEPATH?: string;
    OUTTYPE?: string;
}

export type SaveFileToDocumentResponse = {
    restmethod: {
        outparams: {
            name: 'Alias';
            value: string;
            type: 'string'
        }[];
    }
}

export type UploadFileParams = { uploadId: string; }
    & ({ file: Blob; action: UploadAction.Upload; } | { action: UploadAction.Delete });

export type UploadFileResponse = {
    restmethod: {
        file: {
            path: string;
            loaded: number;
            totalSize: number;
            isComplete: boolean;
        }
    }
};

export type CreateRouteByPointsParams = {
    LAYER: string;
    POINTLIST: string;
    CRS?: string;
    MEASURE?: 'length' | 'time';
    LENGTH?: '1' | '0';
    MARK?: string;
    ROUTETEXT?: '1' | '0';
    OUTTYPE?: OUTTYPE
}
export type CreateRouteByPointsResponse = GeoJsonType & {
    routeinfo: {
        length: number;
        time: number;
        detail: {
            point: Vector2D;
            name: string;
            length: number;
            time: number;
            code: number;
        }[]
    }[]
}

export type GetCoveragePointParams = {
    LAYER: string;
    POINT: string;
    CRS?: string;
    GETGEOHEIGHT?: string;
}

type GetCoveragePointResponseItem = {
    value: number;
    unit: string;
    name: string;
};

export type GetCoveragePointResponse = {
    [key: string]: GetCoveragePointResponseItem;
};

export type CreateThematicMapByFileParams = {
    LAYER: string;
    MINSEMANTICARRAY: string;
    MAXSEMANTICARRAY: string;
    COLORARRAY: string;
    NUMBERCONNECTFIELD: string;
    NUMBERVALUEFIELD: string;
    FILEDELIMETR: string;
    FILECODETYPE: string;
    SEMANTICKEY: string;
    FILEDATA?: string | SimpleJson<any>;
    FILEDATASIZE?: string;
    OUTTYPE?: OUTTYPE;
    SERVICEVERSION?: string;
}

export type CreateThematicMapByFileResponse = GeoJsonType & {
    restmethod: {
        createlayerlist: {
            alias: string;
            id: string;
        }[]
    }
};

export type CreateThematicMapByCsvParams = {
    LAYER: string;
    NUMBERCONNECTFIELD: string;
    FILEDELIMETR?: string; //Разделитель для файла, которым разделяются значения: пробел , / ; \ | _ TAB
    FILEDATA?: string;
    FILEDATASIZE?: string;
    FILTER?: SimpleJson<any>;
    NUMBERFIELDCOLOR?: string;
    NUMBERFIELDSIZE?: string;
    NUMBERFIELDTRANSPARENT?: string;
    OUTTYPE?: OUTTYPE;
    SEMKEYLIST?: string; // ObjName,OnTop Cписок ключей семантик для добавления в объект из файла
    SEMNAMEFIELDLIST?: string;//список полей названия семантики, разделитель ;
    SEMNUMBERFIELDLIST?: string; // 6,7 Список номеров полей семантик в файле, соответствующий SemKeyList или номера полей, в файле csv, используемых для задания правил построения внешнего вида объекта
    SAVEDPATH?: string;
    SAVERESULTONMAINMAP?: string;

    BYOBJECTKEY?: '1';
    SEMANTICKEY?: string;
    KEYLIST?: string;
};

export type CreateThematicMapByCsvResponse = GeoJsonType & {
    restmethod: {
        createlayerlist: {
            alias: string;
            id: string;
        }[]
    }
};

export type TransactionUserParams = {
    LAYER_ID?: string;
    ListName?: string;
}

export type TransactionResponse = {
    restmethod: {
        outparams: [
            {
                name: 'TotalInserted';
                value: string;
                type: 'string';
            },
            {
                name: 'TotalReplaced';
                value: string;
                type: 'string';
            },
            {
                name: 'TotalUpdated';
                value: string;
                type: 'string';
            },
            {
                name: 'TotalDeleted';
                value: string;
                type: 'string';
            },
            {
                name: 'TransactionNumber';
                value: string;
                type: 'string';
            },
            {
                name: 'IdList';
                value: string;
                type: 'string';
            }
        ];
    }
}

export type GetTranslateParams = {
    CRS: string;
    LAYER?: string;
    OUTTYPE?: string;
}

export type GetTranslateResponse = {
    restmethod: {
        outparams: TranslateDescription;
    }
}

export type DeleteLayerParams = {
    LAYERS: string;
}

export type DeleteDataParams = {
    LAYER: string;
};

export type DeleteLayerOnGISServerParams = {
    LAYER: string;
    ServiceVersion?: string;
}

export type CreateUserMapParams = {
    XSDNAME: string;

    LAYERNAME?: string;
    VIRTUALFOLDER?: '0' | '1'              // 1 – создание карты для всех пользователей, 0 –только для текущего пользователя
    CRS?: string;
    SAVEDPATH?: string;                    // Виртуальный путь до созданных данных, в том числе и на ГИС Сервере
    CREATEMAPSCALE?: string;
    ServiceVersion?: string;
}

export type CreateUserMapResponse = {
    restmethod: {
        createlayerlist: {
            alias: string;
            id: string;
            xsdschema: string;
        }[]
    }
}

export type CopyMapResponse = {
    restmethod: {
        createlayerlist: {
            alias: string;
            id: string;
        }[]
    }
};

export type GetBoundRequest = {
    LAYER: string;
    EpsgList?: string;
    OUTTYPE?: string;
}

export type GetBoundResponse = {
    restmethod: {
        outparams: {
            [key: string]: {
                BorderInBaseProjection?: string;
                SupportGeodesy: '0' | '1';
                format: string;
                [crs: string]: string | undefined;
            }
        }
    }
}
export type RenameDataOnGISServerParams = {
    LAYER: string;
    OUTPATHLIST: string;
}


export type GetDataFromFolderParams = {
    PATHNAME: string;
    HOSTNAME?: string;
    DATATYPE?: string;
    LISTTYPE?: 'FILES' | 'PATH';
}


export type GetDataFromFolderResponse = {
    folder: FolderResponseDescription[];
}

export type FolderResponseDescription = { alias: string; } | {
    [key: string]: FolderResponseNode;
}

export type FolderResponseNode = FolderResponseSkippedNode | FolderResponseDataNode;

export type FolderResponseSkippedNode = {
    comm: false;
    nodes: (FolderResponseDataNode | FolderResponseEndNode)[];
};

export type FolderResponseDataNode = {
    comm: true;
    data: string[];
    text: string;
    nodes: (FolderResponseDataNode | FolderResponseEndNode)[];
};

export type FolderResponseEndNode = {
    comm: false;
    text: string;
    name: string;
};

export type GetTransactionListInXmlParams = {
    LAYER: string;
    DateBegin?: string;
    Count?: string;
    TRANSACTIONNUMBER?: string;
};

export type GetTransactionListInXmlResponse = GeoJsonType & {
    actionlist: {
        action: {
            item: {
                data: string;
                object: string;
                semn: string;
                type: string;
            }[];
            kind: string;
            number: string;
            user: string;
        }[];
        date: string;
        fromnumber: string;
        time: string;
    }
};

export type ScenarioParams = {
    id: string;
    alias: string;
    description: string;
    url: string;
}

export type ScenarioData = {
    dataScenario: {
        FileScenario: {
            Scenario: {
                Name: string;
                RscName: string;
                TimeStart: number;
                Repeat: number;
                ChangeSpeed: number;
                Correct: number;
                Object: {
                    ObjectKey: string;
                    ObjectCode: string;
                    TrackFileName: string;
                    TimeStart: number;
                    TimeEnd: number;
                    Speed: number;
                    Repeat: number;
                    TrackObject: number;
                    ShowTrail: number;
                    ShowTrack: number;
                    UseHeight: number;
                    ViewBegin: number;
                    ViewEnd: number;
                    ObjectName: string;
                    AfterObject: number;
                }[]
            };
            AutoSave: string
        };
    };
    scenarioParams: ScenarioParams
}

export enum Operator {
    Cross,
    Inside,
    // Match,
    NotCross,
    // NoMatch,
    // NoOverlap,
    NotTouch,
    Outside,
    // Overlap,
    // ReverseSelection,
    Touch
}

export enum Condition {
    Less = '1',
    Equal = '2',
    EqLess = '3',
    Greater = '4',
    NoEqual = '5',
    EqGreater = '6',
    Any = '7'
}

export enum ObjectListNumber {
    First = '1',
    Second = '2',
}

export type UrlRequestParams = {
    RESTMETHOD: string;
    IDENTIFIER: string;
    SERVICEVERSION: string;
    SERVICE: string
};

export type GetDynamicLabelListResponse = {
    dynamicLabelList: {record: {id: string, name: string, layerList: string[]}}[]
}

export enum RestExecuteStage {
    None,
    Run,
    Ready,
    Complete,
    Cancelled,
    Error
}

export type RestExecuteStatus<T> = {
    done: boolean;
    stage: RestExecuteStage;
    percent: number;
    result: T | undefined;
    error: GwtkError | undefined;
};

export type RestExecutorOptions = {
    delay?: number;
    delayIncrease?: number;
};
