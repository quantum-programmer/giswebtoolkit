import { FeatureGeometry } from '~/utils/GeoJSON';

export type NspdRequestParams = {
    query: string;
    thematicSearchId?: number
}

export interface NspdSearchTextFeature {
    data: {
        features: {
            id: number,
            geometry: FeatureGeometry,
            properties: {
                category: number,
                categoryName: string,
                score: number,
                options: {
                    [key:string]: string
                }
            },
            type: string
        }[],
        type: string
    }
    meta: {
        categoryId: number,
        totalCount: number
    }[]
}