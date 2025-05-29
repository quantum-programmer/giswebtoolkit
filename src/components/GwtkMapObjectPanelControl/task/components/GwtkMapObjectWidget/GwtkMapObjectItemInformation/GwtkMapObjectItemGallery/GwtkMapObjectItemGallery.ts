/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Компонент "Информация об объекте карты. Галерея"        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import MapObject from '~/mapobject/MapObject';
import {
    GwtkMapObjectTaskState,
    RequestItem,
    SELECT_CURRENT_MAPOBJECT_CONTENT,
    REMOVE_OBJECT_DOCUMENT,
    DOWNLOAD_OBJECT_IMAGE,
    FILL_OBJECT_IMAGES,
    UPDATE_OBJECT_DOCUMENT,
    FIT_OBJECT,
    HIGHLIGHT_OBJECT,
    GallerySemanticItem,
    PREVIEW_FILE
} from '../../../../GwtkMapObjectTask';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';


@Component
export default class GwtkMapObjectItemInformationGallery extends Vue {
    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({
        default: () => ({})
    })
    mapObject!: MapObject | null;

    @Prop({ default: () => [] })
    private requestQueue!: { id: string; requestItems: RequestItem[]; }[];

    @Prop({ default: () => ([]) })
    readonly objectAllDocuments!: { key: string, name: string, itemList: GallerySemanticItem[] }[];

    @Prop({
        default: () => ({})
    })
    private showGallery!: boolean;

    mapObjectContent: MapObjectContent | null = null;

    semanticKeyList: string[] = [];

    mounted() {
        if (this.mapObject) {
            this.mapObject.reloadImages();
            Vue.set(this, 'mapObjectContent', new MapObjectContent(this.mapObject));
        }
    }

    get requestItems() {
        let result;
        if (this.mapObject) {
            const id = this.mapObject.gmlId;
            const objectRequestQueue = this.requestQueue.find(requestQueueItem => requestQueueItem.id === id);
            if (objectRequestQueue) {
                result = objectRequestQueue.requestItems;
            }
        }
        return result;
    }

    exit() {
        this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, this.mapObject!);
    }

    remove(path: string, key: string) {
        this.setState(REMOVE_OBJECT_DOCUMENT, { path, key });
    }

    download(imagePath: string) {
        this.setState(DOWNLOAD_OBJECT_IMAGE, imagePath);
    }

    get allowEditPhoto() {
        if (this.mapObject) {
            const editableLayerIds = this.mapObject.vectorLayer.map.options.settings_mapEditor?.maplayersid;
            if (editableLayerIds) {
                return editableLayerIds.includes(this.mapObject.vectorLayer.xId);
            }
        }
        return false;
    }

    getFileExtension(value: string) {
        return value.slice(value.lastIndexOf('.') + 1);
    }

    onClickViewFile(semantic: GallerySemanticItem) {
        if (this.mapObjectContent) {
            this.setState(PREVIEW_FILE, { semantic, mapObjectContent: this.mapObjectContent });
        }
    }

    updateFileDialog(imagePath: string, key: string) {
        this.setState(UPDATE_OBJECT_DOCUMENT, { imagePath, key });
    }

    /**
     * Перейти к объекту карты
     * @method toggleMapObject
     */
    toggleMapObject() {
        if (this.mapObject) {
            this.setState(HIGHLIGHT_OBJECT, this.mapObject);
            this.setState(FIT_OBJECT, this.mapObject);
        }
    }

}
