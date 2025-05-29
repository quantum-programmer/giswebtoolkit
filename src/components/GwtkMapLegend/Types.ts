import { ImageBase64 } from '~/services/BrowserService/BrowserService';

type LegendObject = {
    id: string,
    text: string,
    img?: string,
    url?: string,
    nodes?: LegendObject[],
    isLegendTreeActive?: boolean,
    menu?: {
        additionalMode: boolean;
        settings: boolean;
    },
    locked?: boolean
    panischecked?: boolean;
}

export enum LEGEND_ICON_TYPE {
    viewIcon,
    editorIcon
}

export type LegendSelectType = {}

export type MapLegend = {
    id: string
}

export interface MarkerIcon {
    id: number,
    image: ImageBase64,
    name: string,
    categoryId: number // from 1
}

export interface MarkerImage {
    src: string,
    width: number,
    height: number,
    catalogId: number,
    id: number,
    name: string
}

export interface MapMarkerResponse {
    status: 'success' | 'error',
    data?: {
        images?: MarkerImage[],
        categories?: MarkerImageCategory[],
    },
    error?: string
}

export interface MarkerImageCategory {
    id: number;
    name: string;
}

export interface MapMarkersCommandsFlags {
    isDeleteImage: boolean,
    isGetCategory: boolean,
    isSaveImage: boolean
}

export interface MapMarkersCommands {
    deleteImage: string,
    getCategory: string,
    getImages: string,
    saveImage: string
}

export type GwtkLayer = {}
