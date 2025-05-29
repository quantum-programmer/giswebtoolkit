/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Компонент "Редактирование объекта карты"             *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import {
    ABORT_UPLOAD_FILE,
    EXIT_MODE,
    FILL_OBJECT_IMAGES,
    FIT_OBJECT,
    GwtkMapObjectTaskState,
    HIGHLIGHT_OBJECT,
    ON_CLICK_NEXT,
    ON_CLICK_PREVIOUS,
    SELECT_CURRENT_MAPOBJECT_CONTENT,
    SemanticViewFlags,
    SET_EDITOR_TAB_OPTIONS,
    SHOW_EDIT_PANEL,
    SHOW_GALLERY,
    UPLOAD_IMAGE
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import MapObject from '~/mapobject/MapObject';
import {AngleUnit, CursorCoordinateUnit} from '~/utils/WorkspaceManager';
import GwtkMapObjectItemSemanticEditor
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectWidget/GwtkMapObjectItemEditor/GwtkMapObjectItemSemanticEditor/GwtkMapObjectItemSemanticEditor.vue';
import GwtkMapObjectItemMetricEditor
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectWidget/GwtkMapObjectItemEditor/GwtkMapObjectItemMetricEditor/GwtkMapObjectItemMetricEditor.vue';
import GwtkMapObjectItemStylesEditor
    from '@/components/GwtkMapObjectPanelControl/task/components/GwtkMapObjectWidget/GwtkMapObjectItemEditor/GwtkMapObjectItemStylesEditor/GwtkMapObjectItemStylesEditor.vue';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {LogEventType} from '~/types/CommonTypes';

/**
 * Компонент "Описание объекта карты"
 * @class GwtkMapObjectItemEditor
 * @extends Vue
 */
@Component({ components: { GwtkMapObjectItemSemanticEditor, GwtkMapObjectItemMetricEditor, GwtkMapObjectItemStylesEditor } })
export default class GwtkMapObjectItemEditor extends BaseGwtkVueComponent {

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    readonly mapObject!: MapObject | null;

    @Prop({ default: false })
    readonly showSemanticFileUploadOverlay!: boolean;

    @Prop({ default: false })
    readonly coordinateDisplayFormatValue!: AngleUnit;

    @Prop({ default: 'tab_edit_semantic' })
    readonly mapObjectEditorTabOptions!: string;

    @Prop({ default: '' })
    readonly previewImageSrc!: string;

    @Prop({ default: () => ({}) })
    readonly semanticViewFlags!: SemanticViewFlags;

    @Prop({ default: '' })
    readonly coordinateDisplayFormat!: CursorCoordinateUnit;

    @Prop({ default: 0 }) foundObjectsNumber!: number;

    @Prop({ default: () => 0 })
    readonly currentObjectIndex!: number;

    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    mapObjectContent: MapObjectContent | null = null;

    /**
     * Текущая вкладка
     * @property editorTabOptions {String}
     */
    get editorTabOptions() {
        return this.mapObjectEditorTabOptions;
    }

    set editorTabOptions(tabOption: string) {
        this.setState(SET_EDITOR_TAB_OPTIONS, tabOption);
    }

    created() {
        if (this.mapObject) {
            if(!this.mapObject.hasGeometry()) {
                this.mapObject.loadGeometry().then(() => {
                    this.setupMapObjectContent(this.mapObject!);
                });
            } else{
                this.setupMapObjectContent(this.mapObject);
            }
        }
    }

    private setupMapObjectContent(mapObject: MapObject) {
        Vue.set(this, 'mapObjectContent', new MapObjectContent(mapObject));
        if (this.mapObjectContent) {
            if (!this.mapObjectContent.hasGeometry()) {
                this.mapObjectContent.loadGeometry();
            }
            this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, this.mapObjectContent);
        }
        this.setState(SHOW_EDIT_PANEL, true);

    }

    async save() {
        if (this.mapObjectContent) {
            if(!this.mapObjectContent.validateSemantics()) {
                this.mapVue.getMap().writeProtocolMessage({type:LogEventType.Error, display:true, text:'Не заполнены обязательные семантики'});
                return;
            }
            await this.mapObjectContent.commit();
            this.setState(FILL_OBJECT_IMAGES, this.mapObjectContent);
            this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, this.mapObjectContent.mapObject);
        }
        this.setState(SET_EDITOR_TAB_OPTIONS, 'tab_edit_semantic');
        this.setState(EXIT_MODE, undefined);
    }

    exit() {

        if (this.mapObjectContent) {
            this.mapObjectContent.objectAllSemanticList.forEach(semanticItem => {
                semanticItem.items.forEach((item, index) => {
                    if (this.mapObjectContent) {
                        this.mapObjectContent.updateRepeatableSemantic(item.key, index, item.value);
                    }
                });
            });

            this.setState(SELECT_CURRENT_MAPOBJECT_CONTENT, this.mapObjectContent.mapObject);
        }

        this.setState(SET_EDITOR_TAB_OPTIONS, 'tab_edit_semantic');
        this.setState(EXIT_MODE, undefined);
    }

    abortFileUpload() {
        this.setState(ABORT_UPLOAD_FILE, undefined);
    }


    get galleryImages() {
        return this.mapObject?.objectImages;
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

    openFileDialog() {
        if (this.mapObjectContent) {
            this.setState(UPLOAD_IMAGE, this.mapObjectContent);
        }
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

    onClickNext() {
        this.setState(ON_CLICK_NEXT, null);
    }

    onClickPrevious() {
        this.setState(ON_CLICK_PREVIOUS, null);
    }
}
