/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Компонент "Информация об объекте карты"              *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import {
    GwtkMapObjectTaskState,
    RequestItem,
    EXIT_MODE,
    FIT_OBJECT,
    GET_ROUTE,
    HIGHLIGHT_OBJECT,
    SELECT_MODE,
    SHOW_GALLERY,
    UPLOAD_IMAGE,
    ON_CLICK_NEXT,
    ON_CLICK_PREVIOUS,
    PREVIEW_FILE
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import MapObject from '~/mapobject/MapObject';
import {MapObjectPanelState, ViewDocumentMode} from '~/taskmanager/TaskManager';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';

/**
 * Компонент "Описание объекта карты"
 * @class GwtkMapObjectItemInformation
 * @extends Vue
 */
@Component
export default class GwtkMapObjectItemInformation extends Vue {

    @Prop({default: () => ({})})
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({default: () => ({})})
    readonly mapObject!: MapObject | null;

    @Prop({default: false})
    readonly isGetRouteEnabled!: boolean;

    @Prop({default: () => ([])})
    readonly requestQueue!: { id: string; requestItems: RequestItem[]; }[];

    @Prop({default: () => ([])})
    readonly externalFunctions!: { id: string; text: string; contents: string | null; }[];

    @Prop({default: false})
    readonly showProgressBar!: boolean;

    @Prop({default: false})
    readonly hasDocuments!: boolean;

    @Prop({default: 0}) foundObjectsNumber!: number;

    @Prop({default: () => 0})
    readonly currentObjectIndex!: number;

    @Prop({default: false})
    readonly onlyFilled!: boolean;

    isGetRouteActive = true;

    private interval?: number;

    counter = 0;

    isLoading: boolean = false;

    mapObjectContent: MapObjectContent | null = null;

    get galleryImages() {
        const result: { src: string, path: string }[] = [];
        if (this.mapObject) {
            const serviceImageSemantics = this.mapObject.getServiceImageSemantics();
            for (let i = 0; i < serviceImageSemantics.length; i++) {
                const documentSemantic = serviceImageSemantics[i];
                const imageItem = this.mapObject.objectImages.find(item => item.path === documentSemantic.value);
                if (imageItem) {
                    result.push(imageItem);
                }
            }

            const semanticKeys = this.mapObject.vectorLayer.options.imageSemantics;

            semanticKeys.forEach(key => {
                if (this.mapObject) {
                    const documentSemantics = this.mapObject.getRepeatableSemantics(key);
                    for (let i = 0; i < documentSemantics.length; i++) {
                        const documentSemantic = documentSemantics[i];
                        const imageItem = this.mapObject.objectImages.find(item => item.path === documentSemantic.value);
                        if (imageItem) {
                            result.push(imageItem);
                        }
                    }
                }
            });
        }
        return result;
    }

    created() {
        if (this.mapObject) {
            this.mapObject.reload({geometry: true}).then(() => {
                if (this.mapObject) {
                    this.mapObject.reloadImages();
                    this.setState(HIGHLIGHT_OBJECT, this.mapObject);
                    Vue.set(this, 'mapObjectContent', new MapObjectContent(this.mapObject));

                    if (this.mapObjectContent && !this.onlyFilled) {
                        this.mapObjectContent.setShowAllSemanticsFlag(!this.onlyFilled);
                    }
                }
            });
        }
    }

    //следим за изменением семантик в объекте, например, после поиска в Росреестре
    @Watch('semanticLength')
    updateMapObject() {
        if (this.mapObject) {
            Vue.set(this, 'mapObjectContent', new MapObjectContent(this.mapObject));
        }
    }

    get semanticLength() {
        return this.mapObject?.getSemanticUniqKeys().length;
    }

    comparator(a: number, b: number) {
        return this.externalFunctions[a].contents !== null && (!this.externalFunctions[b] || this.externalFunctions[b].contents !== null);
    }

    startExternalFunction(functionName: string) {
        const existFunction = this.externalFunctions.find(item => item.id === functionName);
        if (existFunction && this.mapObject) {
            if (existFunction.contents !== null) {
                existFunction.contents = null;
            } else {
                const globalFunction = (window as unknown as {
                    [key: string]: ((mapObject: MapObject) => (string | undefined | Promise<string | undefined>)) | undefined
                })[functionName];
                if (globalFunction) {
                    const result = globalFunction(this.mapObject);
                    if (result === undefined || typeof result === 'string') {
                        existFunction.contents = result === undefined ? null : result;
                    } else {
                        existFunction.contents = '';
                        this.isLoading = true;
                        result
                            .then(res => existFunction.contents = res === undefined ? null : res)
                            .catch(e => this.mapObject?.vectorLayer.map.writeProtocolMessage({text: e, display: true}))
                            .finally(() => this.isLoading = false);
                    }
                }
            }
        }
    }

    getProgress() {
        this.counter = 0;
        this.interval = window.setInterval(() => {
            if (this.counter === 11) {
                window.clearInterval(this.interval!);
                this.isGetRouteActive = true;
            }
            this.counter += 1;
        }, 1000);
    }


    setShowObjectEditing() {
        this.setState(SELECT_MODE, MapObjectPanelState.showEditor);
    }

    openFileDialog() {
        if (this.mapObjectContent) {
            this.setState(UPLOAD_IMAGE, this.mapObjectContent);
        }
    }

    exit() {
        this.setState(EXIT_MODE, undefined);
    }

    getRoute() {
        if (this.isGetRouteActive) {
            this.getProgress();
            this.setState(GET_ROUTE, undefined);

            this.isGetRouteActive = false;
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

    private readonly iconAddress = {semantic: 'address', imageName: 'address'};

    private readonly iconPhone = {semantic: 'contact_t', imageName: 'phone'};

    getIconName(key: string) {
        let result;
        if (key === this.iconAddress.semantic) {
            result = this.iconAddress.imageName;
        } else if (key === this.iconPhone.semantic) {
            result = this.iconPhone.imageName;
        }
        return result;
    }

    openGallery() {
        this.setState(SHOW_GALLERY, undefined);
    }


    get allowAddPhoto() {
        if (this.mapObject) {
            const editableLayerIds = this.mapObject.vectorLayer.map.options.settings_mapEditor?.maplayersid;
            if (editableLayerIds) {
                return editableLayerIds.includes(this.mapObject.vectorLayer.xId);
            }
        }
        return false;
    }

    get isEditable() {
        let result = false;

        if (this.mapObject) {
            result = this.mapObject.vectorLayer.isEditable;
        }

        return result;
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

    cleanText(value: string) {
        //TODO: костыль для Рязани и тех, кто ручками печатал теги и символы для переноса
        return typeof value === 'string' ? value.replaceAll('<br />', '').replaceAll('\\r', '\r').replaceAll('\\n', '\n') : value + '';
    }

    onClickViewBimFile(semantic: MapObjectSemanticContent) {
        if (this.mapObjectContent) {
            this.setState(PREVIEW_FILE, {
                semantic,
                mapObjectContent: this.mapObjectContent,
                type: ViewDocumentMode.bim
            });
        }
    }

    onClickNext() {
        this.setState(ON_CLICK_NEXT, null);
    }

    onClickPrevious() {
        this.setState(ON_CLICK_PREVIOUS, null);
    }
}
