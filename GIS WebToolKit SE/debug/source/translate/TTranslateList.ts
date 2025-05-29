/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                     All Rights Reserved                          *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Класс параметров доступа к системам координат      *
 *                                                                  *
 *******************************************************************/

import { TTranslate } from './TTranslate';
import { GetTranslateParams, GetTranslateResponse } from '~/services/RequestServices/RestService/Types';
import DefaultProjections from '~/translate/defautProjections.json';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import TranslateFactory from '~/translate/TranslateFactory';
import { MatrixIdent, TranslateDescription } from '~/translate/Types';
import GwtkError from '~/utils/GwtkError';

const OGC_PREFIX = 'urn:ogc:def:crs:';

/**
 * Список проекций
 */
class TTranslateList {

    /**
     * Список параметров пересчета
     */
    private readonly TrList: Readonly<TTranslate>[] = [];

    /**
     * @constructor
     */
    constructor() {
        const defaults: { [key in keyof typeof DefaultProjections]: string[] } = {
            '3857': ['GoogleMapsCompatible', 'EPSG:3857'],
            '3395': ['EPSG:3395'],
            '4326': ['GlobalCRS84Scale', 'GoogleCRS84Quad'],
            '28400': ['EPSG:28400']
        };

        let crs: keyof typeof DefaultProjections;
        for ( crs in DefaultProjections ) {
            const matrixNames = defaults[ crs ];
            matrixNames.forEach( matrixName => this.addTranslateDescription( matrixName, DefaultProjections[ crs ] as TranslateDescription ) );
        }
    }

    /**
     * Добавить описания параметров пересчета в список
     * @param projectionId {string} Имя матрицы
     * @param description {GetTranslateResponse} Описание
     */
    addTranslateDescription( projectionId: string, description: TranslateDescription ): void {
        this.TrList.push( new TTranslate( projectionId, description ) );
    }

    /**
     * Запросить параметры пересчета на сервисе
     * @async
     * @param matrixName имя матрицы
     */
    async requestTranslate( matrixName: string ): Promise<undefined> {
        const item = this.getItem( matrixName );
        if ( item ) {
            return;
        }

        const matrix = TranslateFactory.createMatrixIdent( matrixName );
        try {
            const description = await TTranslateList.retrieveDescription(matrix);
            const translate = new TTranslate(matrixName, description);
            this.TrList.push(translate);
        } catch (error) {
            console.log('Can`t get CRS parameters for layer ' + matrix.LayerId + ', crs = ' + matrix.Crs);
            const gwtkError = new GwtkError(error);
            throw Error(gwtkError.message);
        }
    }

    /**
     * Запросить по коду EPSG параметры пересчета
     * @param projectionId Код EPSG
     * @returns
     */
    getItem( projectionId: string ): Readonly<TTranslate> | undefined {

        let result = this.TrList.find( translate => translate.ProjectionId === projectionId );

        if ( !result && projectionId.toLowerCase().indexOf( OGC_PREFIX ) === 0 ) {
            //TODO: заменить на использование CRS
            const slicedProjectionId = projectionId.slice( OGC_PREFIX.length ).replace('::',':');
            result = this.TrList.find( translate => translate.ProjectionId === slicedProjectionId );
        }

        return result;
    }

    private static async retrieveDescription( matrix: MatrixIdent ): Promise<TranslateDescription> {

        const serviceUrl = matrix.Url;
        const httpParams = {
            url: serviceUrl
        };

        let result: TranslateDescription;
        if ( matrix.Crs == 3857 ) {
            result = DefaultProjections[ '3857' ] as TranslateDescription;
        } else if ( matrix.Crs == 3395 ) {
            result = DefaultProjections[ '3395' ] as TranslateDescription;
        } else if ( matrix.Crs == 4326 ) {
            result = DefaultProjections[ '4326' ] as TranslateDescription;
        } else {
            const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );
            const getTranslate: GetTranslateParams = {
                LAYER: encodeURIComponent( matrix.LayerId ),
                CRS: 'EPSG:' + matrix.Crs.toString(),
                OUTTYPE: OUTTYPE.JSON
            };

            const response = (await service.getTranslate( getTranslate )).data;
            if ( response && response.restmethod && response.restmethod.outparams ) {
                result = response.restmethod.outparams;
            } else {
                throw Error( 'Empty getTranslate response' );
            }
        }

        return result;
    }
}

const TranslateList = new TTranslateList();

export default TranslateList;

