/*******************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Типы для утилит                           *
 *                                                                  *
 *******************************************************************/
import { SimpleJson } from '~/types/CommonTypes';
import { ErrorResponse } from '../RequestServices/RestService/Types';

export type ServiceLink = {
    href: string;
    protocol: string;
    origin: string;
    pathname: string;
    folderpath: string;
}

export interface ServiceResponse<T = string> {
    data?: T;
    error?: string | ErrorResponse;
}

export type XMLRpcData = { RESTMETHOD: string; } & ({
    LAYER: string;
} | { LAYERNAME1: string; LAYERNAME2: string; } | { CLASSIFIERNAME: string }) & SimpleJson<string | undefined>
