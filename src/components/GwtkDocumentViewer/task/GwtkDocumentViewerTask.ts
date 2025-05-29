/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Компонент просмотра Документов                 *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkDocumentViewerWidget from '@/components/GwtkDocumentViewer/task/GwtkDocumentViewerWidget.vue';

import * as THREE from 'three';
import * as OBC from 'openbim-components';
import { FragmentsGroup } from 'bim-fragment';
import { LogLevel } from 'web-ifc';
import { BrowserService } from '~/services/BrowserService';
import i18n from '@/plugins/i18n';
import { ViewDocumentMode } from '~/taskmanager/TaskManager';
import {
    IMAGE_EXTENSIONS,
    VIDEO_EXTENSIONS
} from '../../../../GIS WebToolKit SE/debug/source/services/BrowserService/BrowserService';

export const ON_RESIZE = 'GwtkDocumentViewer.onresize';
export const SET_BIM_CANVAS = 'GwtkBIMWiewer.setbimcanvas';
export const DELETE_OBJECT = 'GwtkDocumentViewer.deleteobject';
export const TOGGLE_LAYER_VISIBLE = 'GwtkDocumentViewer.togglelayervisible';
export const TOGGLE_OBJECT_VISIBLE = 'GwtkDocumentViewer.toggleobjectvisible';
export const ON_CANVAS_MOUSE_CLICK = 'GwtkDocumentViewer.oncanvasmouseclick';
export const ON_ELEMENT_MOUSE_CLICK = 'GwtkDocumentViewer.onelementmouseclick';
export const CLEAR_SELECT = 'GwtkDocumentViewer.clearcelect';
export const CHANGE_ACTIVE_OBJECT = 'GwtkDocumentViewer.changeactiveObject';
export const START_ON_SEMANTIC_MODE = 'GwtkDocumentViewer.startonsemanticMode';
export const ON_CLICK_SUBMIT_BUTTON = 'GwtkDocumentViewer.onclicksubmitbutton';
export const START_ON_PREVIEW_MODE = 'GwtkDocumentViewer.startonpreViewDocumentMode';
export const ON_LOAD_BIM = 'GwtkDocumentViewer.onloadbim';
export const ON_LOAD_IMAGE = 'GwtkDocumentViewer.onloadimage';
export const ON_LOAD_VIDEO = 'GwtkDocumentViewer.onloadvideo';
export const OPEN_FILE_DIALOG = 'GwtkDocumentViewer.openfiledialog';
export const RESET_CAMERA_POSITION = 'GwtkDocumentViewer.resetcameraposition';
export type GwtkDocumentViewerState = {
    [ON_RESIZE]: { width: number, height: number };
    [SET_BIM_CANVAS]: HTMLCanvasElement;
    [DELETE_OBJECT]: number;
    [TOGGLE_LAYER_VISIBLE]: ModelTreeNode;
    [TOGGLE_OBJECT_VISIBLE]: string;
    [ON_CANVAS_MOUSE_CLICK]: null;
    [ON_ELEMENT_MOUSE_CLICK]: ModelTreeNode;
    [CLEAR_SELECT]: null;
    [CHANGE_ACTIVE_OBJECT]: number;
    [START_ON_SEMANTIC_MODE]: { resolve: (value: boolean) => void; reject: () => void; };
    [ON_CLICK_SUBMIT_BUTTON]: null;
    [START_ON_PREVIEW_MODE]: null;
    [ON_LOAD_BIM]: File;
    [ON_LOAD_IMAGE]: { src: string, name: string };
    [ON_LOAD_VIDEO]: { src: string, name: string };
    [OPEN_FILE_DIALOG]: null;
    [RESET_CAMERA_POSITION]: null;
}

export type IFCLayer = { start: number; count: number; materialIndex?: number | undefined; };

type WidgetParams = {
    setState: GwtkDocumentViewerTask['setState'];
    componentWidth: number,
    componentHeight: number,
    objects: { id: string, name: string, visible: boolean, layers: ModelTreeNode[], type: ViewDocumentMode }[],
    selectedElement: string;
    activeObject: number;
    showLoadingOverlay: boolean;
    uploadFileMode: boolean;
    semanticData: { name: string; value: { key: string | number; value: string | number }[] }[];
    viewDocumentMode: ViewDocumentMode;
    selectedMediaSrc: string;
    selectedExpressID: string;
    highlightExpressID: number[];
    highlightNodeList: ModelTreeNode[];
}

export type ModelTreeNode = { name: string, expressID: number, class: string, children: ModelTreeNode[], visible: boolean, fragmentIdMap: OBC.FragmentIdMap | boolean }

/**
 * Компонент 'Построение тепловой карты'
 * @class GwtkDocumentViewerTask
 * @extends Task
 * @description
 */
export default class GwtkDocumentViewerTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;
    private components?: OBC.Components;
    private hider: OBC.FragmentHider | undefined;
    private classifier: OBC.FragmentClassifier | undefined;
    private models: FragmentsGroup[] = [];
    private fragments: OBC.FragmentManager | undefined;
    private scene: THREE.Scene | undefined;
    private fragmentIfcLoader: OBC.FragmentIfcLoader | undefined;
    private highlighter: OBC.FragmentHighlighter | undefined;
    private propsProcessor: OBC.IfcPropertiesProcessor | undefined;
    private grid: OBC.SimpleGrid | undefined;
    private camera: OBC.SimpleCamera | undefined;
    private activeModel = 0;

    private canvas?: HTMLCanvasElement;

    resolveFunction?: (result: boolean) => void;
    rejectFunction?: () => void;

    /**
     * @constructor GwtkDocumentViewerTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            componentWidth: 565,
            componentHeight: 540,
            objects: [],
            selectedElement: '',
            activeObject: 0,
            showLoadingOverlay: false,
            uploadFileMode: false,
            semanticData: [],
            viewDocumentMode: ViewDocumentMode.empty,
            selectedMediaSrc: '',
            selectedExpressID: '',
            highlightExpressID: [],
            highlightNodeList: []
        };
    }

    protected destroy() {
        super.destroy();
        this.map.requestRender();
        if (this.components) {
            this.components.renderer.get().dispose();
            this.components.dispose();
            this.components = undefined;
        }

        if (this.resolveFunction) {
            this.resolveFunction(false);
        }
        this.rejectFunction = undefined;
        this.resolveFunction = undefined;
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента настройки
        const nameWidget = 'GwtkDocumentViewerWidget';
        const sourceWidget = GwtkDocumentViewerWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWindowWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    private initBIMViewer() {

        this.components = new OBC.Components();
        this.components.scene = new OBC.SimpleScene(this.components);
        this.components.renderer = new OBC.PostproductionRenderer(this.components, this.canvas);
        this.camera = new OBC.SimpleCamera(this.components);
        this.components.camera = this.camera;
        (this.components.renderer as OBC.PostproductionRenderer).postproduction.enabled = true;

        const postproduction = (this.components.renderer as OBC.PostproductionRenderer).postproduction;
        this.grid = new OBC.SimpleGrid(this.components);
        postproduction.customEffects.excludedMeshes.push(this.grid.get());
        postproduction.setPasses({ ao: false, gamma: false, custom: false });
        this.components.raycaster = new OBC.SimpleRaycaster(this.components);

        this.components.uiEnabled = false;
        this.components.init();

        this.hider = new OBC.FragmentHider(this.components);
        this.scene = this.components.scene.get();

        const directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(5, 10, 3);
        directionalLight.intensity = 0.5;
        this.scene.add(directionalLight);
        const ambientLight = new THREE.AmbientLight();
        ambientLight.intensity = 0.5;
        this.scene.add(ambientLight);

        this.fragments = new OBC.FragmentManager(this.components);

        this.scene.background = new THREE.Color('white');
        this.classifier = new OBC.FragmentClassifier(this.components);
        this.fragmentIfcLoader = new OBC.FragmentIfcLoader(this.components);
        this.fragmentIfcLoader.config.logLevel = LogLevel.LOG_LEVEL_OFF;
        this.highlighter = new OBC.FragmentHighlighter(this.components);

        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: '#BCF124',
            depthTest: false,
            opacity: 0.1
        });

        this.highlighter.add('default', [highlightMaterial]);
        this.highlighter.outlineEnabled = true;
        this.highlighter.outlineMaterial.color.set(0xf0ff7a);
        this.highlighter.outlineMaterial.opacity = 0.8;

        const highlighterEvents = this.highlighter.events;
        this.propsProcessor = new OBC.IfcPropertiesProcessor(this.components);

        window.setTimeout(() => {
            highlighterEvents.default.onClear.add(() => {
                if (this.propsProcessor) {
                    this.propsProcessor.cleanPropertiesList();
                    this.widgetProps.semanticData = [];
                    this.widgetProps.highlightExpressID.splice(0);
                    this.widgetProps.highlightNodeList.splice(0);
                    this.widgetProps.selectedElement = '';
                }
            });
            highlighterEvents.default.onHighlight.add(
                (selection) => {
                    const keys = Object.keys(selection);

                    const values: string[] = [];
                    if (keys.length > 0 && selection[keys[0]]) {
                        selection[keys[0]].forEach((value) => values.push(value));
                    }
                    this.widgetProps.selectedExpressID = values[0];
                    this.widgetProps.selectedElement = values[0];

                    this.widgetProps.highlightExpressID.splice(0);
                    this.widgetProps.highlightNodeList.splice(0);
                    for (const key of keys) {
                        const idList = selection[key];
                        idList.forEach((value) => {
                            this.widgetProps.highlightExpressID.push(Number(value));
                        });

                    }

                    this.fillSelectedNodeList();

                    const fragmentID = Object.keys(selection)[0];
                    const expressID = this.widgetProps.selectedExpressID;
                    let model;
                    if (this.fragments) {
                        for (const group of this.fragments.groups) {
                            const a = Object.keys(selection)[0];
                            if (a) {
                                for (let i = 0; i < a.length; i++) {
                                    const value = group.keyFragments[i];
                                    if (value === fragmentID) {
                                        model = group;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    model = this.models[this.activeModel];
                    if (model && this.propsProcessor) {
                        const semanticData = this.propsProcessor.getProperties(model, expressID);
                        if (semanticData) {
                            this.widgetProps.semanticData.splice(0);
                            for (let i = 0; i < semanticData.length; i++) {
                                const semantic = semanticData[i];
                                let semanticName = '';
                                if (semantic.Name && semantic.Name.value) {
                                    semanticName = semantic.Name.value;
                                }
                                this.widgetProps.semanticData.push({ name: semanticName, value: [] });
                                const semanticKeys = Object.keys(semantic);
                                for (let j = 0; j < semanticKeys.length; j++) {
                                    const key = semanticKeys[j];
                                    if (key === 'HasProperties' && semantic[key]) {
                                        const propetries = semantic[key];
                                        for (let k = 0; k < propetries.length; k++) {
                                            const propetry = propetries[k].value;
                                            if (propetry.NominalValue && this.widgetProps.semanticData[i].value) {
                                                this.widgetProps.semanticData[i].value.push({ key: propetry.Name.value, value: propetry.NominalValue.value });
                                            }
                                        }
                                    }
                                    if (semantic[key] && semantic[key].value) {
                                        this.widgetProps.semanticData[i].value.push({ key, value: semantic[key].value });
                                    }
                                }
                            }
                        }
                    }
                }
            );
        }, 100);
    }

    fillSelectedNodeList() {
        this.widgetProps.highlightNodeList.splice(0);
        const nodeList = this.widgetProps.objects[this.widgetProps.activeObject].layers;
        for (let i = 0; i < nodeList.length; i++) {
            this.checkSelectedNode(nodeList[i]);
        }
    }

    checkSelectedNode(node: ModelTreeNode) {
        let result = false;
        const id = Number(this.widgetProps.selectedExpressID);
        if (node.expressID === id) {
            this.widgetProps.highlightNodeList.push(node);
            result = true;
        } else if (node.children.length > 0) {
            for (let i = 0; i < node.children.length; i++) {
                if (this.checkSelectedNode(node.children[i])) {
                    this.widgetProps.highlightNodeList.push(node);
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    onCanvasMouseClick() {
        if (this.components && this.components.enabled) {
            this.highlighter?.highlight('default', true);
        }
    }

    clearSelect() {
        this.highlighter?.clear();
        this.widgetProps.selectedElement = '';
    }

    onFileInput(file: File) {

        const extension = file.name.slice(file.name.lastIndexOf('.') + 1);

        if (extension === 'ifc') {
            if (!this.components) {
                this.initBIMViewer();
            }

            if (this.fragmentIfcLoader) {
                this.widgetProps.showLoadingOverlay = true;
                // path: unpkg.com/browse/web-ifc@0.0.46/
                this.fragmentIfcLoader.settings.wasm = {
                    path: 'gwtkse/wasm/',
                    absolute: true
                };
                file.arrayBuffer().then((data: ArrayBuffer) => {
                    const buffer = new Uint8Array(data);
                    if (this.fragmentIfcLoader) {
                        this.widgetProps.viewDocumentMode = ViewDocumentMode.bim;
                        this.fragmentIfcLoader.load(buffer, file.name).then((model: FragmentsGroup) => {
                            model.position.x = 0;
                            model.position.y = 0;
                            model.position.z = 0;
                            this.models.push(model);
                            this.addModelOnScene(this.models.length - 1);
                            this.widgetProps.showLoadingOverlay = false;
                        }).catch((e) => {
                            console.log(e);
                            this.widgetProps.showLoadingOverlay = false;
                        });
                    }
                });
            }
        } else if (IMAGE_EXTENSIONS.includes(extension)) {
            const src = BrowserService.makeObjectURL(file);
            const name = file.name;
            this.widgetProps.viewDocumentMode = ViewDocumentMode.image;
            this.widgetProps.selectedMediaSrc = src;
            this.widgetProps.objects.push({ id: src, name, visible: true, layers: [], type: ViewDocumentMode.image });
            this.setState(CHANGE_ACTIVE_OBJECT, this.widgetProps.objects.length - 1);
        } else if (VIDEO_EXTENSIONS.includes(extension)) {
            const src = BrowserService.makeObjectURL(file);
            const name = file.name;
            this.widgetProps.viewDocumentMode = ViewDocumentMode.video;
            this.widgetProps.selectedMediaSrc = src;
            this.widgetProps.objects.push({ id: src, name: name, visible: true, layers: [], type: ViewDocumentMode.video });
            this.setState(CHANGE_ACTIVE_OBJECT, this.widgetProps.objects.length - 1);
        } else {
            this.mapWindow.addSnackBarMessage(i18n.tc('documentviewer.File format not supported'));
        }
    }

    mergeNodeTree(nodeList: ModelTreeNode[]) {
        for (let counter = 0; counter < nodeList.length; counter++) {
            for (let i = 0; i < nodeList.length; i++) {
                if (this.mergeNode(nodeList[i].children, nodeList[counter])) {
                    nodeList.splice(counter, 1);
                    counter = 0;
                    i = 0;
                }
            }
        }
        return nodeList;
    }

    mergeNode(nodeList: ModelTreeNode[], node: ModelTreeNode) {
        for (let i = 0; i < nodeList.length; i++) {
            if (this.mergeNode(nodeList[i].children, node)) {
                return true;
            } else {
                if (nodeList[i].expressID === node.expressID) {
                    for (let j = 0; j < node.children.length; j++) {
                        nodeList[i].children.push(node.children[j]);
                    }
                    return true;
                }
            }
        }
        return false;
    }

    addModelOnScene(modelNumber: number) {
        this.widgetProps.semanticData = [];
        this.highlighter?.clear();
        const activeModel = this.models[this.activeModel];
        if (activeModel && this.scene) {
            this.scene.remove(activeModel);
        }
        this.activeModel = this.models.length - 1;
        const model = this.models[modelNumber];
        this.widgetProps.activeObject = this.widgetProps.objects.length - 1;
        if (this.hider && this.classifier && this.components) {
            this.hider.loadCached();
            const componentIds = Object.keys(this.components.tools.list);
            for (const id of componentIds) {
                if (this.components.tools.list[id] instanceof OBC.FragmentClassifier) {
                    delete this.components.tools.list[id];
                }
            }
            this.classifier = new OBC.FragmentClassifier(this.components);

            this.propsProcessor?.process(model);

            const modelGroups: ModelTreeNode[] = [];

            if (model.properties && this.propsProcessor) {
                this.propsProcessor.process(model);
                const keys = Object.keys(model.properties);

                for (const key of keys) {
                    const value = model.properties[Number(key)];
                    if (value && value.type === 160246688) {
                        const groupId = value.RelatingObject.value;
                        const groupChildIds: { value: number, type: number }[] = Object.values(value.RelatedObjects);
                        const nodeChildren: ModelTreeNode[] = [];
                        for (let i = 0; i < groupChildIds.length; i++) {
                            const childId = groupChildIds[i].value;

                            const childProps = this.propsProcessor.getProperties(model, String(childId));
                            if (childProps) {
                                let name = childProps[0].Name ? (childProps[0].LongName ? (childProps[0].Name.value + ' ' + childProps[0].LongName.value) : childProps[0].Name.value) : '';
                                if (name.length < 1) {
                                    name = i18n.tc('documentviewer.Untitled');
                                }
                                const fragmentIdMap = this.getFragmentIdMap(String(childId));
                                nodeChildren.push({ name, expressID: childId, class: OBC.IfcCategoryMap[childProps[0].type], children: [], visible: true, fragmentIdMap });
                            }
                        }

                        const nodeProps = this.propsProcessor.getProperties(model, String(groupId));
                        if (nodeProps) {
                            let name = nodeProps[0].Name ? nodeProps[0].Name.value : '';
                            if (name.length < 1) {
                                name = i18n.tc('documentviewer.Untitled');
                            }
                            const fragmentIdMap = this.getFragmentIdMap(String(nodeProps[0].expressID));
                            const node = { name, expressID: nodeProps[0].expressID, class: OBC.IfcCategoryMap[nodeProps[0].type], children: nodeChildren, visible: true, fragmentIdMap };
                            modelGroups.push(node);
                        }
                    }
                }

                for (const key of keys) {
                    const value = model.properties[Number(key)];
                    if (value && value.type === 3242617779) {
                        const nodeChildren: ModelTreeNode[] = [];
                        if (value.RelatedElements) {
                            const childrenExpressIDs: { value: number, type: number }[] = Object.values(value.RelatedElements);
                            for (let i = 0; i < childrenExpressIDs.length; i++) {
                                const childrenExpressID = childrenExpressIDs[i].value;
                                const childProps = this.propsProcessor.getProperties(model, String(childrenExpressID));
                                if (childProps) {
                                    let name = '';
                                    if (childProps[0] && childProps[0].Name) {
                                        name = childProps[0].LongName ? (childProps[0].Name.value + ' ' + childProps[0].LongName.value) : childProps[0].Name.value;
                                    }
                                    if (name.length < 1) {
                                        name = i18n.tc('documentviewer.Untitled');
                                    }
                                    const fragmentIdMap = this.getFragmentIdMap(String(childrenExpressID));
                                    nodeChildren.push({ name, expressID: childrenExpressID, class: OBC.IfcCategoryMap[childProps[0].type], children: [], visible: true, fragmentIdMap });
                                }
                            }
                        }

                        const nodeProps = this.propsProcessor.getProperties(model, value.RelatingStructure.value);
                        if (nodeProps) {
                            const fragmentIdMap = this.getFragmentIdMap(String(nodeProps[0].expressID));
                            const node = { name: nodeProps[0].Name.value, expressID: nodeProps[0].expressID, class: OBC.IfcCategoryMap[nodeProps[0].type], children: nodeChildren, visible: true, fragmentIdMap };
                            modelGroups.push(node);

                        }
                    }
                }

                this.mergeNodeTree(modelGroups);
                this.widgetProps.objects.push({ id: String(model.id), name: model.name, visible: true, layers: modelGroups, type: ViewDocumentMode.bim });
            }
        }
        if (this.propsProcessor) {
            this.propsProcessor.process(model);
        }
        this.setState(CHANGE_ACTIVE_OBJECT, this.widgetProps.objects.length - 1);
        if (this.components) {
            this.components.renderer.resize();
            (this.components.camera as OBC.SimpleCamera).updateAspect();
        }
    }

    toggleLayerVisible(element: ModelTreeNode, visible?: boolean) {
        if (this.hider) {
            const fragmentIdMap = element.fragmentIdMap;
            if (fragmentIdMap) {
                if (visible !== undefined) {
                    element.visible = visible;
                }
                this.hider.set(element.visible, fragmentIdMap as OBC.FragmentIdMap);
            }
            if (element.children.length > 0) {
                for (let i = 0; i < element.children.length; i++) {
                    this.toggleLayerVisible(element.children[i], element.visible);
                }
            }
        }
    }

    highlightElements(element: ModelTreeNode, reset = true) {
        if (this.highlighter) {
            const fragmentIdMap = element.fragmentIdMap;
            if (fragmentIdMap) {
                const zoomToElement = this.widgetProps.selectedElement === String(element.expressID);
                this.highlighter?.highlightByID('default', fragmentIdMap as OBC.FragmentIdMap, reset, zoomToElement);
                this.widgetProps.selectedElement = String(element.expressID);
            }
        }
    }

    getFragmentIdMap(expressID: string) {
        const model = this.models[this.models.length - 1];
        let fragmentIdMap: OBC.FragmentIdMap = {};
        if (model) {
            for (let i = 0; i < model.items.length; i++) {
                const item = model.items[i];
                for (let j = 0; j < item.items.length; j++) {
                    const id = item.items[j];
                    if (expressID === id) {
                        if (!fragmentIdMap[model.items[i].id]) {
                            const set: Set<string> = new Set();
                            set.add(expressID);
                            fragmentIdMap[model.items[i].id] = set;
                        } else {
                            fragmentIdMap[model.items[i].id].add(expressID);
                        }
                    } else if (id.includes('.')) {
                        if (id.split('.')[0] === expressID) {
                            if (fragmentIdMap[model.items[i].id] === undefined) {
                                const set: Set<string> = new Set();
                                set.add(id);
                                fragmentIdMap[model.items[i].id] = set;
                            } else {
                                fragmentIdMap[model.items[i].id].add(id);
                            }
                        }
                    }
                }
            }
            return fragmentIdMap;
        }
        return false;
    }

    async setState<K extends keyof GwtkDocumentViewerState>(key: K, value: GwtkDocumentViewerState[K]) {
        switch (key) {
            case SET_BIM_CANVAS:
                this.canvas = value as HTMLCanvasElement;
                break;
            case OPEN_FILE_DIALOG:
                const accept = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS, 'ifc'].map(extension => '.' + extension);
                BrowserService.openFileDialog(accept).then((file) => {
                    if (file) {
                        this.onFileInput(file[0]);
                    }
                });
                break;
            case ON_RESIZE:
                if (this.components && this.components.enabled) {
                    const size = value as { width: number, height: number };
                    if (size.width <= 1 || size.height <= 1) {
                        this.components.renderer.get().setSize(1, 1);
                    } else {
                        this.components.renderer.resize();
                    }

                    (this.components.camera as OBC.SimpleCamera).updateAspect();
                }
                break;
            case DELETE_OBJECT:
                const index = value as number;
                const object = this.widgetProps.objects[index];
                const type = object.type;
                if (type === ViewDocumentMode.bim) {
                    const modelIndex = this.models.findIndex((model) => String(model.id) === object.id);
                    if (modelIndex !== -1) {
                        this.fragments?.disposeGroup(this.models[modelIndex]);
                        if (this.scene) {
                            this.scene.remove(this.models[modelIndex]);
                        }
                        this.models.splice(modelIndex, 1);
                    }
                }

                const activeObject = (index - 1) > 0 ? (index - 1) : 0;
                this.widgetProps.objects.splice(index, 1);
                this.setState(CHANGE_ACTIVE_OBJECT, activeObject);
                if (this.widgetProps.objects.length === 0) {
                    this.widgetProps.viewDocumentMode = ViewDocumentMode.empty;
                }
                break;
            case TOGGLE_LAYER_VISIBLE:
                if (value && this.hider) {
                    const element = value as ModelTreeNode;
                    this.toggleLayerVisible(element);
                }

                break;
            case ON_ELEMENT_MOUSE_CLICK:
                if (value) {
                    const element = value as ModelTreeNode;
                    this.highlightElements(element);
                }
                break;
            case ON_CANVAS_MOUSE_CLICK:
                this.onCanvasMouseClick();
                break;
            case CLEAR_SELECT:
                this.clearSelect();
                break;
            case CHANGE_ACTIVE_OBJECT:
                const tabIndex = value as number;
                const tabObject = this.widgetProps.objects[tabIndex];
                if (tabObject) {
                    const type = tabObject.type;
                    if (type === ViewDocumentMode.bim) {
                        if (this.scene) {
                            this.widgetProps.viewDocumentMode = ViewDocumentMode.bim;
                            const activeModel = this.models[this.activeModel];
                            if (activeModel && this.widgetProps.objects[this.widgetProps.activeObject]) {
                                const layer = this.widgetProps.objects[this.widgetProps.activeObject].layers;
                                for (let i = 0; i < layer.length; i++) {
                                    this.toggleLayerVisible(layer[i], false);
                                }
                                this.scene.remove(activeModel);
                            }
                            this.activeModel = this.models.findIndex((model) => String(model.id) === tabObject.id);
                            const model = this.models[this.activeModel];
                            if (model && this.classifier && this.hider) {
                                this.classifier.dispose();
                                this.classifier.byEntity(model);
                                const layer = this.widgetProps.objects[tabIndex].layers;
                                for (let i = 0; i < layer.length; i++) {
                                    this.toggleLayerVisible(layer[i], true);
                                }
                                this.scene.add(model);
                                model.position.y = 0;
                                this.widgetProps.semanticData = [];
                                this.highlighter?.clear();
                                this.highlighter?.update();
                                if (this.grid) {
                                    this.grid.get().position.y = model.boundingBox.min.y;
                                }
                            }
                        }
                    } else if (type === ViewDocumentMode.image) {
                        this.widgetProps.selectedMediaSrc = tabObject.id;
                        this.widgetProps.viewDocumentMode = ViewDocumentMode.image;
                    } else if (type === ViewDocumentMode.video) {
                        this.widgetProps.selectedMediaSrc = tabObject.id;
                        this.widgetProps.viewDocumentMode = ViewDocumentMode.video;
                    }
                    this.widgetProps.activeObject = tabIndex;
                }
                break;
            case START_ON_SEMANTIC_MODE:
                const callback = value as { resolve: (value: boolean) => void; reject: () => void; };
                this.widgetProps.uploadFileMode = true;
                this.resolveFunction = callback.resolve;
                this.rejectFunction = callback.reject;
                break;
            case START_ON_PREVIEW_MODE:
                this.widgetProps.uploadFileMode = false;
                break;
            case ON_CLICK_SUBMIT_BUTTON:
                if (this.resolveFunction) {
                    this.resolveFunction(true);
                }
                this.mapWindow.getTaskManager().detachTask(this.id);
                break;
            case ON_LOAD_BIM:
                if (value) {
                    this.onFileInput(value as File);
                }
                break;
            case ON_LOAD_IMAGE:
                if (value) {
                    const { src, name } = value as { src: string, name: string };
                    this.widgetProps.viewDocumentMode = ViewDocumentMode.image;
                    this.widgetProps.selectedMediaSrc = src as string;
                    this.widgetProps.objects.push({ id: src, name: name as string, visible: true, layers: [], type: ViewDocumentMode.image });
                    this.setState(CHANGE_ACTIVE_OBJECT, this.widgetProps.objects.length - 1);
                }
                break;
            case ON_LOAD_VIDEO:
                if (value) {
                    const { src, name } = value as { src: string, name: string };
                    this.widgetProps.viewDocumentMode = ViewDocumentMode.video;
                    this.widgetProps.selectedMediaSrc = src as string;
                    this.widgetProps.objects.push({ id: src, name: name as string, visible: true, layers: [], type: ViewDocumentMode.video });
                    this.setState(CHANGE_ACTIVE_OBJECT, this.widgetProps.objects.length - 1);
                }
                break;
            case RESET_CAMERA_POSITION:
                if (this.camera && this.components) {
                    // @ts-ignore
                    this.components.camera.controls.reset();
                }
                break;
        }
    }
}
