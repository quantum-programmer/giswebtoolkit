/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                      'Просмотр документов'                       *
 *                                                                  *
 *******************************************************************/

import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { TaskDescription, ViewDocumentMode } from '~/taskmanager/TaskManager';
import Utils from '~/services/Utils';
import {
    DELETE_OBJECT,
    GwtkDocumentViewerState,
    ON_CANVAS_MOUSE_CLICK,
    ON_RESIZE,
    SET_BIM_CANVAS,
    TOGGLE_LAYER_VISIBLE,
    TOGGLE_OBJECT_VISIBLE,
    ON_ELEMENT_MOUSE_CLICK,
    CLEAR_SELECT,
    CHANGE_ACTIVE_OBJECT,
    ON_CLICK_SUBMIT_BUTTON,
    START_ON_PREVIEW_MODE,
    RESET_CAMERA_POSITION,
    ModelTreeNode,
    OPEN_FILE_DIALOG
} from './GwtkDocumentViewerTask';


/**
 * Виджет компонента
 * @class GwtkDocumentViewerWidget
 * @extends Vue
 */
@Component
export default class GwtkDocumentViewerWidget extends BaseGwtkVueComponent {
    @Prop({ default: '' })
    readonly taskId!: string;

    @Prop({ default: () => ({}) })
    readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkDocumentViewerState>(key: K, value: GwtkDocumentViewerState[K]) => void;

    @Prop({ default: [] })
    readonly objects!: { id: string, name: string, layers: ModelTreeNode[] }[];

    @Prop({ default: [] })
    readonly highlightExpressID!: number[];

    @Prop({ default: '' })
    readonly selectedElement!: string;

    @Prop({ default: '' })
    readonly selectedMediaSrc!: string;

    @Prop({ default: '' })
    readonly selectedExpressID!: string;

    @Prop({ default: 'empty' })
    readonly viewDocumentMode!: ViewDocumentMode;

    @Prop({ default: 0 })
    readonly activeObject!: number;

    @Prop({ default: false })
    readonly showLoadingOverlay!: boolean;

    @Prop({ default: false })
    readonly uploadFileMode!: boolean;

    @Prop({ default: [] })
    readonly semanticData!: { name: string; value: { key: string | number; value: string | number }[] }[];

    @Prop({ default: [] })
    readonly highlightNodeList!: ModelTreeNode[];

    private height: number = 0;
    private width: number = 0;
    private resizeObserver: ResizeObserver | null = null;
    private mouseDownCoord = { x: 0, y: 0 };
    private treePanelOpen = false;

    showInformation = false;

    get isBIMMode() {
        return this.viewDocumentMode === ViewDocumentMode.bim;
    }

    get isImageMode() {
        return this.viewDocumentMode === ViewDocumentMode.image;
    }

    get isVideoMode() {
        return this.viewDocumentMode === ViewDocumentMode.video;
    }

    @Watch('highlightNodeList')
    onHighlightNodeListChange() {
        if (!this.treePanelOpen && this.highlightNodeList.length) {
            this.onChangeOpenTree();
        }
    }


    mounted() {
        const viewerComponent = (this.$refs.viewerComponent as HTMLDivElement);
        this.setState(SET_BIM_CANVAS, (this.$refs.bimcanvas as HTMLCanvasElement));

        const heightUpdate5 = Utils.throttle(() => {
            const clientHeight = viewerComponent.getBoundingClientRect().height;
            const clientWidth = viewerComponent.getBoundingClientRect().width;
            this.height = clientHeight;
            this.width = clientWidth;
            this.setState(ON_RESIZE, { width: this.width, height: this.height });
        }, 5);

        this.resizeObserver = new ResizeObserver(heightUpdate5);
        this.resizeObserver.observe(viewerComponent);
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    deleteObject(id: number) {
        this.setState(DELETE_OBJECT, id);
    }

    toggleLayerVisible(node: ModelTreeNode) {
        this.setState(TOGGLE_LAYER_VISIBLE, node);
    }

    toggleObjectVisible(id: string) {
        this.setState(TOGGLE_OBJECT_VISIBLE, id);
    }

    onElementMouseClick(node: ModelTreeNode) {
        this.setState(ON_ELEMENT_MOUSE_CLICK, node);
    }

    onClickFileInputButton() {
        this.setState(OPEN_FILE_DIALOG, null);
    }

    onCanvasMouseClick() {
        this.setState(ON_CANVAS_MOUSE_CLICK, null);
    }

    onMouseDown(event: MouseEvent) {
        this.mouseDownCoord.x = event.x;
        this.mouseDownCoord.y = event.y;
    }

    onMouseUp(event: MouseEvent) {

        const deltaX = event.x > this.mouseDownCoord.x ? (event.x - this.mouseDownCoord.x) : (this.mouseDownCoord.x - event.x);
        const deltaY = event.y > this.mouseDownCoord.y ? (event.y - this.mouseDownCoord.y) : (this.mouseDownCoord.y - event.y);
        if (deltaX < 2 && deltaY < 2) {
            this.onCanvasMouseClick();
        }
    }

    onCanvasMouseLeave() {
        this.setState(CLEAR_SELECT, null);
    }

    checkGroupSelected(elements: { id: string, visible: boolean }[]) {
        const index = elements.findIndex((element) => element.id === this.selectedElement);
        return index !== -1;
    }

    onChangeTabs(value: any) {
        this.setState(CHANGE_ACTIVE_OBJECT, value);
    }

    onChangeOpenTree() {
        this.treePanelOpen = !this.treePanelOpen;
        if (!this.treePanelOpen) {
            this.setState(CLEAR_SELECT, null);
        }
    }

    onClickCancel() {
        this.deleteObject(this.activeObject);
        this.setState(START_ON_PREVIEW_MODE, null);
        if (this.objects.length === 0) {
            this.mapVue.getTaskManager().detachTask(this.taskId);
        }
    }

    onClickSubmit() {
        this.setState(ON_CLICK_SUBMIT_BUTTON, null);
    }

    resetCameraPosition() {
        this.setState(RESET_CAMERA_POSITION, null);
    }

    getItemKey(sourceName: string): string {
        if (sourceName === 'GlobalId') {
            return this.$tc('documentviewer.Identifier');
        } else if (sourceName === 'ObjectType') {
            return this.$tc('documentviewer.Object type');
        } else if (sourceName === 'OwnerHistory') {
            return this.$tc('documentviewer.Owner history');
        } else if (sourceName === 'ObjectPlacement') {
            return this.$tc('documentviewer.Object placement');
        } else if (sourceName === 'Representation') {
            return this.$tc('documentviewer.Representation');
        } else if (sourceName === 'Tag') {
            return this.$tc('documentviewer.Tag');
        } else if (sourceName === 'CompositionType') {
            return this.$tc('documentviewer.Composition type');
        } else if (sourceName === 'LongName') {
            return this.$tc('documentviewer.Long name');
        } else if (sourceName === 'InteriorOrExteriorSpace') {
            return this.$tc('documentviewer.Interior or exterior space');
        } else {
            return sourceName;
        }
    }

    checkElement(element: { key: string | number; value: string | number; }): boolean {
        return element.key !== 'Name'
            && element.key !== element.value;
    }
}
