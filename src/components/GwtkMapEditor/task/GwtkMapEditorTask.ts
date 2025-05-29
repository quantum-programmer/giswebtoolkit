/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Задача редактора карты                        *
 *                                                                  *
 *******************************************************************/

import MapWindow, {ButtonDescription, SaveObjectPanelProps} from '~/MapWindow';
import Task, {MessageParameter} from '~/taskmanager/Task';
import GwtkMapEditorWidget from './GwtkMapEditorWidget.vue';
import {AppendPointActionState} from '~/systemActions/AppendPointAction';
import {LOCALE, LogEventType} from '~/types/CommonTypes';
import CreateObjectActionLink from '../actions/CreateObjectActionLink';
import {EditorLayoutDescription, GwtkComponentDescriptionPropsData} from '~/types/Types';
import VectorLayer from '~/maplayers/VectorLayer';
import MergeObjectsAction from '../actions/MergeObjectsAction';
import SelectSegmentAction from '../actions/SelectSegmentAction';
import EditSegmentActionLink from '../actions/EditSegmentActionLink';
import AppendPointToSegmentAction from '../actions/AppendPointToSegmentAction';
import {PointInfo} from '~/mapobject/geometry/BaseMapObjectGeometry';
import {
    ACTION_CANCEL,
    ACTION_COMMIT,
    ActionModePanel,
    MODE_PANEL_KEYS,
    PRIMARY_PANEL_ID,
    SAVE_PANEL_ID,
    SECONDARY_PANEL_ID
} from '~/taskmanager/Action';
import QuickEditEditorAction from '../actions/QuickEditEditorAction';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import MoveObjectsAction from '../actions/MoveObjectsAction';
import TransformObjectsAction from '../actions/TransformObjects';
import EditPointEditorAction from '../actions/EditPointEditorAction';
import {DataChangedEvent, MapObjectPanelState} from '~/taskmanager/TaskManager';
import {TransactionData} from '~/utils/TransactionLog';
import i18n from '@/plugins/i18n';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import Utils from '~/services/Utils';
import CreateAnyContourAction from '../actions/creation/CreateAnyContourAction';
import CreateRectangleAction from '../actions/creation/CreateRectangleAction';
import CreateInclinedRectangleAction from '../actions/creation/CreateInclinedRectangleAction';
import CreateCircleAction from '../actions/creation/CreateCircleAction';
import CopyObjectsAction, {CopyObjectOperation} from '../actions/CopyObjectsAction';
import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import SplitObjectAction from '../actions/SplitObjectAction';
import CreateSubObjectAction from '@/components/GwtkMapEditor/actions/CreateSubObjectAction';
import GwtkError from '~/utils/GwtkError';
import XMLElement from '~/services/Utils/XMLElement';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import {ServiceResponse} from '~/services/Utils/Types';
import {ParseTextToXml} from '~/services/Utils/XMLDoc';
import {BrowserService} from '~/services/BrowserService';
import JSZip from 'jszip';
import FileUploader from '~/utils/FileUploader';
import {
    GetLoadDataResponse,
    GetStatusDataResponse,
    LoadData,
    UploadFileResponse
} from '~/services/RequestServices/RestService/Types';
import RequestService from '~/services/RequestServices/common/RequestService';
import GeoJSON, {CRS, FeatureType, GeoJsonType} from '~/utils/GeoJSON';
import {Vector2or3, Vector3D} from '~/3d/engine/core/Types';
import EditAttributesAction from '@/components/GwtkMapEditor/actions/EditAttributesAction';
import DeleteObjectEditorAction from '@/components/GwtkMapEditor/actions/DeleteObjectEditorAction';

export const CREATE_MODE_ACTION = 'gwtkmapeditor.createmode';
export const CREATE_MODE_RECTANGLE_ACTION = 'gwtkmapeditor.createmoderectangle';
export const CREATE_MODE_INCLINED_RECTANGLE_ACTION = 'gwtkmapeditor.createmodeinclinedrectangle';
export const CREATE_MODE_CIRCLE_ACTION = 'gwtkmapeditor.createmodecircle';
export const SELECT_SEGMENT_ACTION = 'gwtkmapeditor.selectsegment';
export const CREATE_OBJECT_ACTION = 'gwtkmapeditor.createobject';
export const CREATE_SUBOBJECT_ACTION = 'gwtkmapeditor.createsubobject';
export const EDIT_OBJECT_ACTION = 'gwtkmapeditor.editobject';
export const DELETE_OBJECT_ACTION = 'gwtkmapeditor.deleteobject';
export const EDIT_POINT_ACTION = 'gwtkmapeditor.editpoint';
export const EDIT_SEGMENT_ACTION = 'gwtkmapeditor.editsegment';
export const MERGE_OBJECTS_ACTION = 'gwtkmapeditor.mergeobjects';
export const MOVE_OBJECTS_ACTION = 'gwtkmapeditor.moveobjects';
export const TRANSFORM_OBJECTS_ACTION = 'gwtkmapeditor.transformobjects';
export const COPY_OBJECTS_ACTION = 'gwtkmapeditor.copyobjects';
export const SPLIT_OBJECT_ACTION = 'gwtkmapeditor.splitobjects';
export const EDIT_ATTRIBUTES_ACTION = 'gwtkmapeditor.editattributes';
export const UNDO_TRANSACTION = 'gwtkmapeditor.undotransaction';
export const UNDO_TRANSACTION_FOR_LAYER = 'gwtkmapeditor.undotransactionforlayer';
export const REDO_TRANSACTION = 'gwtkmapeditor.redotransaction';
export const SEGMENT_ADD_POINT_ACTION = 'gwtkmapeditor.segmentaddpointaction';
export const SEGMENT_ADD_POINT_ACTION_COMMIT = 'gwtkmapeditor.segmentaddpointactioncommit';
export const SELECT_LAYOUT = 'gwtkmapeditor.selectlayout';
export const UPDATE_LAYOUT = 'gwtkmapeditor.updatelayout';
export const SELECT_LAYOUT_LAYER = 'gwtkmapeditor.selectlayoutlayer';
export const SELECT_LAYER_FOR_COPY = 'gwtkmapeditor.selectlayerforcopy';
export const SET_COPY_OBJECT_PANEL_FINAL = 'gwtkmapeditor.setcopyobjectpanelfinal';
export const SET_COPY_OBJECT_OPERATION = 'gwtkmapeditor.setcopyobjectoperation';
export const SET_COPY_OBJECT_DELETE_ORIGINAL = 'gwtkmapeditor.setcopyobjectdeleteoriginal';
export const OPEN_PUBLISH_OBJECT_DIALOG = 'gwtkmapeditor.openpublishobjectdialog';
export const SET_PUBLISH_OBJECT_CRS = 'gwtkmapeditor.setpublishobjectcrs';
export const SET_PUBLISH_OBJECT_MAP_NAME = 'gwtkmapeditor.setpublishobjectmapname';
export const PUBLISH_OBJECT_FROM_FILE_DATA = 'gwtkmapeditor.publishobjectfromfiledata';
export const CLICK_PUBLISH_OBJECT_BUTTON_OK = 'gwtkmapeditor.clickpublishobjectbuttonok';
export const CLICK_PUBLISH_OBJECT_BUTTON_CANCEL = 'gwtkmapeditor.clickpublishobjectbuttoncancel';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_X = 'gwtkmapeditor.createobjectmanualinputcoordschangex';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_Y = 'gwtkmapeditor.createobjectmanualinputcoordschangey';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_POINT_HEIGHT = 'gwtkmapeditor.createobjectmanualinputcoordschangepointheight';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_ADD_POINT = 'gwtkmapeditor.createobjectmanualinputcoordsaddpoint';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_REMOVE_POINT = 'gwtkmapeditor.createobjectmanualinputcoordsremovepoint';
export const CREATE_OBJECT_FROM_OBJECT = 'gwtkmapeditor.createobjectfromobject';
export const CREATE_OBJECT_COMMIT = 'gwtkmapeditor.createobjectcommit';
export const SET_OBJECT_EDITOR_DATA = 'gwtkmapeditor.setobjecteditordata';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS = 'gwtkmapeditor.createobjectmanualinputcoords';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_OK = 'gwtkmapeditor.createobjectmanualinputcoordsbuttonok';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_CANCEL = 'gwtkmapeditor.createobjectmanualinputcoordsbuttoncancel';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_REVERSE_DIRECTION = 'gwtkmapeditor.createobjectmanualinputcoordsreversedirection';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_IMPORT_FROM_JSON_FILE = 'gwtkmapeditor.createobjectmanualinputcoordsimportfromjsonfile';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_EXPORT_TO_JSON_FILE = 'gwtkmapeditor.createobjectmanualinputcoordsexporttotxtfile';
export const CREATE_OBJECT_MANUAL_INPUT_COORDS_FILL_COORD_TABLE = 'gwtkmapeditor.createobjectmanualinputcoordfillcoordtable';
export const START_WAIT_CAPTURING = 'gwtkmapeditor.startwaitcapturing';
export const STOP_WAIT_CAPTURING = 'gwtkmapeditor.endwaitcapturing';

export type GwtkMapEditorTaskState = {
    [CREATE_OBJECT_ACTION]: boolean;
    [CREATE_SUBOBJECT_ACTION]: boolean;
    [EDIT_OBJECT_ACTION]: boolean;
    [DELETE_OBJECT_ACTION]: boolean;
    [EDIT_POINT_ACTION]: boolean;
    [EDIT_SEGMENT_ACTION]: boolean;
    [MERGE_OBJECTS_ACTION]: boolean;
    [MOVE_OBJECTS_ACTION]: boolean;
    [TRANSFORM_OBJECTS_ACTION]: boolean;
    [COPY_OBJECTS_ACTION]: boolean;
    [SPLIT_OBJECT_ACTION]: boolean;
    [EDIT_ATTRIBUTES_ACTION]: boolean;
    [UNDO_TRANSACTION]: boolean;
    [UNDO_TRANSACTION_FOR_LAYER]: undefined;
    [REDO_TRANSACTION]: boolean;
    [SEGMENT_ADD_POINT_ACTION]: PointInfo[];
    [SEGMENT_ADD_POINT_ACTION_COMMIT]: undefined;
    [SELECT_LAYOUT]: string | undefined;
    [UPDATE_LAYOUT]: string | undefined;
    [SELECT_LAYOUT_LAYER]: string;
    [SELECT_LAYER_FOR_COPY]: string;
    [SET_COPY_OBJECT_PANEL_FINAL]: undefined;
    [SET_COPY_OBJECT_OPERATION]: CopyObjectOperation;
    [SET_COPY_OBJECT_DELETE_ORIGINAL]: boolean;
    [ACTION_CANCEL]: undefined;
    [ACTION_COMMIT]: undefined;
    [OPEN_PUBLISH_OBJECT_DIALOG]: undefined;
    [SET_PUBLISH_OBJECT_CRS]: string;
    [SET_PUBLISH_OBJECT_MAP_NAME]: string;
    [PUBLISH_OBJECT_FROM_FILE_DATA]: ServiceResponse<GetLoadDataResponse>;
    [CLICK_PUBLISH_OBJECT_BUTTON_OK]: undefined;
    [CLICK_PUBLISH_OBJECT_BUTTON_CANCEL]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_X]: { positionNumber: number, value: string };
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_Y]: { positionNumber: number, value: string };
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_POINT_HEIGHT]: { positionNumber: number, value: string };
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_ADD_POINT]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_REMOVE_POINT]: number;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS]: undefined;
    [CREATE_OBJECT_FROM_OBJECT]: MapObject | undefined;
    [CREATE_OBJECT_COMMIT]: MapObject;
    [SET_OBJECT_EDITOR_DATA]: FeatureType | undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_OK]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_CANCEL]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_IMPORT_FROM_JSON_FILE]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_EXPORT_TO_JSON_FILE]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_REVERSE_DIRECTION]: undefined;
    [CREATE_OBJECT_MANUAL_INPUT_COORDS_FILL_COORD_TABLE]: string;
    [START_WAIT_CAPTURING]: undefined;
    [STOP_WAIT_CAPTURING]: undefined;
} & AppendPointActionState;

export interface CopyActionInfo {
    selectedLayerXId: string;
    currentObject: MapObject | null;
    isDeleteOriginalObjectEnabled: boolean;
    deleteOriginalObjectFlag: boolean;
    objectsCount: number;
    selectedObjectsCount: number;
    isSourceTargetSchemasEqual: boolean;
}

export type PublishObject = {
    isPublished: boolean;
    mapName: string;
    crsList: { list: CrsItem[], select: string };
    isManualInput: boolean;
    coordinatesList: Vector2or3[];
    mapObjectType: MapObjectType,
    objectName: string,
    buttonsActions: ButtonsList;
}

export type CrsItem = {
        epsg: string;
        name: string;
        comment: string;
}

export type ButtonsList = { text: string; value: string; enable: boolean }[];
type WidgetParams = {
    layouts: {
        id: string;
        description: EditorLayoutDescription | null;
    }[];
    layerItems: {
        id: string;
        text: string;
    }[];
    copyActionInfo: CopyActionInfo;
    buttons: ButtonDescription[];
    modePanel: ActionModePanel;
    selectedLayerXId: string;
    actionMessage?: string;
    setState: <K extends keyof GwtkMapEditorTaskState>(key: K, value?: GwtkMapEditorTaskState[K]) => void;
    isUndoForLayerDisabled: boolean;
    isLocalLayerSelected: boolean;
    publishObject: PublishObject;
    isWaitCapturing: boolean;
};

//разрешенные для загрузки файлы
const ALLOWED_FILE_EXTENSIONS = ['.mif', '.mid', '.rsc', '.shp', '.dxf', '.sxf', '.json', '.csv', '.dwg']; // .rsc - для MIF/MID
//разрешенные для импорта координат расширения
const ALLOWED_JSON_EXTENSIONS = ['.json'];

/**
 * Задача редактора карты
 * @class GwtkMapEditorTask
 * @extends Task
 */
export default class GwtkMapEditorTask extends Task {

    /**
     * Слой для объектов
     * @private
     * @readonly
     * @property vectorLayer {VectorLayer}
     */
    vectorLayer?: VectorLayer;

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private activeMapObjectDescriptionId?: string;

    protected workspaceData: {
        layoutsList: {
            id: string;
            layouts: {
                id: string;
                description: EditorLayoutDescription | null;
            }[]
        }[];
    } = { layoutsList: [], };

    private actionIdCurrent = '';

    private readonly objectListForCopy: MapObject[] = [];

    /**
     * Название загружаемого файла
     * @private
     * @property uploadLink {string}
     */
    private uploadLink = '';

    /**
     * Знаменатель масштаба карты
     * @private
     * @readonly
     * @property publishMapScale {string}
     */
    private readonly publishMapScale = '1000000';

    /**
     * Список загруженных файлов
     * @private
     * @property filesList {FileList}
     */
    private filesList:FileList | undefined;

    /**
     * Идентификатор загрузки
     * @private
     * @property jobId {String|undefined}
     */
    private jobId: string | undefined;

    private objectEditorData?: FeatureType;

    /**
     * @constructor GwtkMapEditorTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        const layerItems: { id: string; text: string; }[] = [];

        this.map.vectorLayers.forEach( layer => {
            if ( layer.isEditable ) {
                const text: string = layer.alias ? layer.alias : '(' + i18n.t( 'mapeditor.Undefined' ) + ')';
                layerItems.push( { id: layer.xId, text } );
            }
        } );
        layerItems.sort( ( a, b ) => Utils.sortAlphaNum( a.text, b.text ) );

        const copyActionInfo: CopyActionInfo = {
            currentObject: null,
            deleteOriginalObjectFlag: false,
            isDeleteOriginalObjectEnabled: this.isOperationEnabled( 'delete' ),
            objectsCount: 0,
            selectedObjectsCount: 0,
            isSourceTargetSchemasEqual: true,
            selectedLayerXId: ''
        };

        let selectedLayerXId = '';
        if ( layerItems.length > 0 ) {
            selectedLayerXId = layerItems[ 0 ].id;

            const activeObject = this.map.getActiveObject();

            if ( activeObject ) {
                const layer = layerItems.find( item => item.id === activeObject.vectorLayer.xId );
                if ( layer ) {
                    selectedLayerXId = layer.id;
                }
            }

        }

        if ( layerItems.length > 1 ) {
            copyActionInfo.selectedLayerXId = layerItems[ 1 ].id;
        }

        let createIsEnabled = false;
        let editIsEnabled = false;
        let deleteIsEnabled = false;

        if ( layerItems.length > 0 ) {
            createIsEnabled = this.isOperationEnabled( 'create' );
            editIsEnabled = this.isOperationEnabled( 'edit' );
            deleteIsEnabled = this.isOperationEnabled( 'delete' );
        }

        this.actionRegistry.push( {
            getConstructor() {
                return CreateAnyContourAction;
            },
            id: CREATE_MODE_ACTION,
            active: false,
            enabled: createIsEnabled
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return CreateRectangleAction;
            },
            id: CREATE_MODE_RECTANGLE_ACTION,
            active: false,
            enabled: createIsEnabled
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return CreateInclinedRectangleAction;
            },
            id: CREATE_MODE_INCLINED_RECTANGLE_ACTION,
            active: false,
            enabled: createIsEnabled
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return CreateCircleAction;
            },
            id: CREATE_MODE_CIRCLE_ACTION,
            active: false,
            enabled: createIsEnabled
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return AppendPointToSegmentAction;
            },
            id: SEGMENT_ADD_POINT_ACTION,
            active: false,
            enabled: editIsEnabled
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return SelectSegmentAction;
            },
            id: SELECT_SEGMENT_ACTION,
            active: false,
            enabled: layerItems.length > 0
        } );

        this.actionRegistry.push( {
            getConstructor() {
                return CreateObjectActionLink;
            },
            id: CREATE_OBJECT_ACTION,
            active: false,
            enabled: createIsEnabled,
            options: {
                icon: 'object-creation',
                title: 'mapeditor.Create object'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return CreateSubObjectAction;
            },
            id: CREATE_SUBOBJECT_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'subobject-creation',
                title: 'mapeditor.Create subobject'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return QuickEditEditorAction;
            },
            id: EDIT_OBJECT_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'quick-edit',
                title: 'mapeditor.Edit object'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return DeleteObjectEditorAction;
            },
            id: DELETE_OBJECT_ACTION,
            active: false,
            enabled: deleteIsEnabled,
            options: {
                icon: 'delete-object',
                title: 'mapeditor.Delete object'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return EditPointEditorAction;
            },
            id: EDIT_POINT_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'edit-point',
                title: 'mapeditor.Move point'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return EditSegmentActionLink;
            },
            id: EDIT_SEGMENT_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'edit-segment',
                title: 'mapeditor.Edit part'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return MergeObjectsAction;
            },
            id: MERGE_OBJECTS_ACTION,
            active: false,
            enabled: editIsEnabled && deleteIsEnabled,
            options: {
                icon: 'merge-objects',
                title: 'mapeditor.Merging'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return MoveObjectsAction;
            },
            id: MOVE_OBJECTS_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'move-objects',
                title: 'mapeditor.Move objects'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return TransformObjectsAction;
            },
            id: TRANSFORM_OBJECTS_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'scale-rotate',
                title: 'mapeditor.Move, rotate and scale'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return CopyObjectsAction;
            },
            id: COPY_OBJECTS_ACTION,
            active: false,
            enabled: createIsEnabled,
            options: {
                icon: 'copy-object',
                title: 'mapeditor.Copying selected objects'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return SplitObjectAction;
            },
            id: SPLIT_OBJECT_ACTION,
            active: false,
            enabled: editIsEnabled && createIsEnabled,
            options: {
                icon: 'split-object',
                title: 'mapeditor.Dissection of linear object'
            }
        } );
        this.actionRegistry.push( {
            getConstructor() {
                return EditAttributesAction;
            },
            id: EDIT_ATTRIBUTES_ACTION,
            active: false,
            enabled: editIsEnabled,
            options: {
                icon: 'pencil',
                title: 'mapeditor.Edit object attributes'
            }
        } );
        this.widgetProps = {
            buttons: [
                this.getActionDescription( CREATE_OBJECT_ACTION )!,
                this.getActionDescription( CREATE_SUBOBJECT_ACTION )!,
                this.getActionDescription( EDIT_OBJECT_ACTION )!,
                this.getActionDescription( DELETE_OBJECT_ACTION )!,
                this.getActionDescription( EDIT_POINT_ACTION )!,
                this.getActionDescription( EDIT_SEGMENT_ACTION )!,
                this.getActionDescription( SPLIT_OBJECT_ACTION )!,
                this.getActionDescription( MERGE_OBJECTS_ACTION )!,
                this.getActionDescription( MOVE_OBJECTS_ACTION )!,
                this.getActionDescription( TRANSFORM_OBJECTS_ACTION )!,
                this.getActionDescription( COPY_OBJECTS_ACTION )!,
                this.getActionDescription( EDIT_ATTRIBUTES_ACTION )!,
                {
                    id: UNDO_TRANSACTION,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'undo',
                        title: 'mapeditor.Undo recent changes'
                    }
                },
                {
                    id: REDO_TRANSACTION,
                    active: false,
                    enabled: false,
                    options: {
                        icon: 'redo',
                        title: 'mapeditor.Redo recent changes'
                    }
                }
            ],
            modePanel: {
                [ PRIMARY_PANEL_ID ]: undefined,
                [ SECONDARY_PANEL_ID ]: undefined,
                [ SAVE_PANEL_ID ]: undefined
            },
            selectedLayerXId,
            layerItems,
            layouts: [],
            actionMessage: undefined,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            taskId: this.id,
            setState: this.setState.bind( this ),
            isUndoForLayerDisabled: true,
            copyActionInfo: copyActionInfo,
            isLocalLayerSelected: false,
            publishObject: {
                isPublished: false,
                mapName: '',
                crsList: {
                    list: [],
                    select: ''
                },
                isManualInput: false,
                coordinatesList: [],
                mapObjectType: MapObjectType.Point,
                objectName: '',
                buttonsActions: [],
            },
            isWaitCapturing: false
        };

        this.vectorLayer = this.map.vectorLayers.find( item => item.id === selectedLayerXId );

        this.updateTransactionButtons();

        this.checkLayersStatus().then(() => {
            if (this.widgetProps.layerItems.length === 0) {
                for (let i = 0; i < this.actionRegistry.length; i++) {
                    this.actionRegistry[i].enabled = false;
                }
            }
        });
    }

    private getMapObjectType() {
        let mapObject: MapObjectType = MapObjectType.Point;
        const activeObject = this.map.getActiveObject();
        if (activeObject) {
            mapObject = activeObject.type;
        }
        return mapObject;
    }

    private getObjectName() {
        const activeObject = this.map.getActiveObject();
        return activeObject && activeObject.objectName || '';
    }

    private isOperationEnabled( operation: 'edit' | 'create' | 'delete' ): boolean {
        let result = false;
        const functions = this.map.options.settings_mapEditor?.functions;
        if ( functions ) {
            result = functions.includes( '*' ) || functions.includes( operation );
        }
        return result;
    }

    updateTransactionButtons() {
        const undoButton = this.widgetProps.buttons.find((item: { id: string; }) => item.id === UNDO_TRANSACTION);
        if (undoButton) {
            undoButton.enabled = this.mapWindow.getTaskManager().getTransactionsCount() !== 0;
        }
        const redoButton = this.widgetProps.buttons.find((item: { id: string; }) => item.id === REDO_TRANSACTION);
        if (redoButton) {
            redoButton.enabled = this.mapWindow.getTaskManager().getUndoneTransactionsCount() !== 0;
        }

        this.widgetProps.isUndoForLayerDisabled = this.mapWindow.getTaskManager().getTransactionsCount(this.widgetProps.selectedLayerXId) === 0;

    }

    private validateWorkspaceData() {
        if (this.workspaceData) {
            for (let i = 0; i < this.workspaceData.layoutsList.length; i++) {
                const layout = this.workspaceData.layoutsList[i];
                if (layout.id !== '' && !this.map.vectorLayers.find(layer => layer.id === layout.id)) {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mapeditor.Recovery error'),
                        description: i18n.tc('mapeditor.Could not find layer') + ': ' + layout.id,
                        type: LogEventType.Error,
                        display: true
                    });
                    this.workspaceData.layoutsList.splice(i, 1);
                    this.writeWorkspaceData(true);
                }
            }
        }
    }

    setup() {
        super.setup();

        if ( !this.workspaceData ) {
            this.workspaceData = { layoutsList: [] };
        }
        this.validateWorkspaceData();

        for ( let i = 0; i < this.map.vectorLayers.length; i++ ) {
            const layer = this.map.vectorLayers[ i ];

            if ( this.workspaceData.layoutsList.find( layouts => layouts.id === layer.id ) ) {
                continue;
            }

            if ( layer.isEditable ) {
                const layouts = [];
                for ( let i = 0; i < 12; i++ ) {
                    layouts.push( { id: 'layout_' + i, description: null } );
                }
                this.workspaceData.layoutsList.push( { id: layer.id, layouts } );
            }
        }

        if ( !this.workspaceData.layoutsList.find( layouts => layouts.id === '' ) ) {
            //для локальных слоев
            const layouts = [];
            for ( let i = 0; i < 12; i++ ) {
                layouts.push( { id: 'layout_' + i, description: null } );
            }
            this.workspaceData.layoutsList.push( { id: '', layouts } );
        }

        this.widgetProps.layouts.splice( 0, 0, ...(this.getLayouts( this.widgetProps.selectedLayerXId ) || []) );

        this.saveLayouts();

        this.map.textObjectSelection = true;
    }

    protected destroy() {
        super.destroy();
        this.map.textObjectSelection = false;
    }

    onDataChanged( event: DataChangedEvent ) {
        if ( event.type === 'content' ) {
            this.widgetProps.layerItems.splice( 0 );

            this.map.vectorLayers.forEach( layer => {
                if ( layer.isEditable ) {
                    this.widgetProps.layerItems.push( { id: layer.xId, text: layer.alias } );
                }
            } );
            this.widgetProps.layerItems.sort( ( a, b ) => Utils.sortAlphaNum( a.text, b.text ) );
        }
    }

    private async checkLayersStatus() {
        setTimeout(() => {
            this.mapWindow.showOverlay();
        }, 0);

        for (let i = 0; i < this.map.vectorLayers.length; i++) {
            const layer = this.map.vectorLayers[i];
            const idx = this.widgetProps.layerItems.findIndex(item => item.id === layer.id);
            if (layer.isEditable && idx !== -1) {
                try {
                    await layer.getLayerStatus();
                } catch (e) {
                    const idx = this.widgetProps.layerItems.findIndex(item => item.id === layer.id);
                    if (idx !== -1) {
                        this.widgetProps.layerItems.splice(idx, 1);
                    }
                }
            }
        }

        const index = this.widgetProps.layerItems.findIndex((item) => item.id === this.widgetProps.selectedLayerXId);
        if (index === -1) {
            const firstItem = this.widgetProps.layerItems[0];
            if (firstItem && firstItem.id) {
                this.setState(SELECT_LAYOUT_LAYER, firstItem.id);
            }
        }

        setTimeout(() => {
            this.mapWindow.removeOverlay();
        }, 0);
    }

    onTransactionLogChanged() {
        this.updateTransactionButtons();
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkMapEditorWidget';
        const source = GwtkMapEditorWidget;
        this.mapWindow.registerComponent( name, source );

        // создание экземпляра Vue компонента
        this.mapWindow.createWidget( name, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    createModePanel( modePanelDescription: ActionModePanel ) {
        MODE_PANEL_KEYS.forEach( ( key ) => {
            const modePanel = modePanelDescription[ key ];
            if ( modePanel !== undefined ) {
                this.widgetProps.modePanel[ key ] = modePanel;
            }
        } );

        const saveObjectPanelProps: SaveObjectPanelProps = {
            saveActive: false,
            visiblePanel: true,
            modePanel: modePanelDescription
        };
        this.mapWindow.showSaveObjectPanel( saveObjectPanelProps );
    }

    removeModePanel( modePanelId?: keyof ActionModePanel ) {
        if ( modePanelId !== undefined ) {
            this.widgetProps.modePanel[ modePanelId ] = undefined;
        } else {
            MODE_PANEL_KEYS.forEach( ( key ) => {
                this.widgetProps.modePanel[ key ] = undefined;
            } );
            const saveObjectPanelProps: SaveObjectPanelProps = {
                saveActive: false,
                visiblePanel: false,
                modePanel: {}
            };
            this.mapWindow.showSaveObjectPanel( saveObjectPanelProps );
        }
    }

    get isCopyPanelFinalSet(): boolean {
        return !!this.widgetProps.copyActionInfo.currentObject;
    }

    updateObjectListForCopy(): void {

        this.objectListForCopy.splice( 0 );

        const selectedObjects = this.map.getSelectedObjects();

        let isSchemasEqual = true;
        const layerForCopy = this.map.getVectorLayerByxId( this.widgetProps.copyActionInfo.selectedLayerXId );
        if ( layerForCopy ) {
            selectedObjects.forEach( mapObject => {
                if ( mapObject.vectorLayer.xId !== this.widgetProps.copyActionInfo.selectedLayerXId ) {
                    if ( !this.widgetProps.copyActionInfo.deleteOriginalObjectFlag || mapObject.vectorLayer.isEditable ) {
                        this.objectListForCopy.push( mapObject );
                        if ( isSchemasEqual && mapObject.schema ) {
                            isSchemasEqual = layerForCopy.options.schemename.includes( mapObject.schema );
                        }
                    }
                }
            } );
        }

        this.widgetProps.copyActionInfo.currentObject = null;
        this.widgetProps.copyActionInfo.isSourceTargetSchemasEqual = isSchemasEqual;
        this.widgetProps.copyActionInfo.objectsCount = this.objectListForCopy.length;
        this.widgetProps.copyActionInfo.selectedObjectsCount = selectedObjects.length;

    }

    private fillNextObjectForCopyInfo(): void {
        this.widgetProps.copyActionInfo.objectsCount = this.objectListForCopy.length;
        if ( this.widgetProps.copyActionInfo.objectsCount === 0 ) {
            if ( this._action ) {
                this.setAction( this._action.id, false );
            }
        } else {
            this.widgetProps.copyActionInfo.currentObject = this.objectListForCopy[ 0 ] || null;
        }
    }

    resetCopyObjectsPanel(): void {
        this.widgetProps.copyActionInfo.objectsCount = 0;
        this.widgetProps.copyActionInfo.selectedObjectsCount = 0;
        this.widgetProps.copyActionInfo.currentObject = null;
        this.objectListForCopy.splice( 0 );
    }

    async loadGeometryForMapObjects( mapObjects: MapObject[] ): Promise<MapObject[] | undefined> {
        this.mapWindow.showOverlay();

        const layerList = new Set<VectorLayer>();

        const withoutGeometryList: MapObject[] = [];
        for ( const mapObject of mapObjects ) {
            if ( !mapObject.hasGeometry() ) {
                if ( !layerList.has( mapObject.vectorLayer ) ) {
                    layerList.add( mapObject.vectorLayer );
                    mapObject.vectorLayer.startTransaction();
                }
                withoutGeometryList.push( mapObject );
            }
        }

        if ( withoutGeometryList.length !== 0 ) {
            for (let i = 0; i < withoutGeometryList.length; i++) {
                const mapObject = withoutGeometryList[i];
                await mapObject.reload();
            }
            try {
                const layerListArray= Array.from(layerList);
                for (let i = 0; i < layerListArray.length; i++) {
                    const vectorLayer = layerListArray[i];
                    await vectorLayer.reloadTransaction({ geometry: true, properties: true });
                }
            } catch (error) {
                this.map.writeProtocolMessage({
                    text: i18n.tc('mapeditor.Error getting object geometry'),
                    type: LogEventType.Error,
                    display: true
                });
                this.mapWindow.removeOverlay();
                return;
            }
        }

        this.mapWindow.removeOverlay();

        return mapObjects;
    }

    private async copyObject( count: number ): Promise<void> {

        const vectorLayerForCopy = this.map.vectorLayers.find( item => item.xId === this.widgetProps.copyActionInfo.selectedLayerXId );
        if ( !vectorLayerForCopy ) {
            this.map.writeProtocolMessage( {
                text: i18n.t( 'mapeditor.Layer for copying not found' ) + '',
                type: LogEventType.Error,
                display: true
            } );
            return;
        }

        const currentObjectListForCopy = await this.loadGeometryForMapObjects( this.objectListForCopy.splice( 0, count ) );

        if ( !currentObjectListForCopy ) {
            return;
        }

        const vectorLayersSet = new Set<VectorLayer>();

        vectorLayersSet.add( vectorLayerForCopy );

        vectorLayerForCopy.startTransaction();

        currentObjectListForCopy.forEach( currentObjectOriginal => {
            const newMapObject = vectorLayerForCopy.createMapObject( currentObjectOriginal.type );
            const objectNumber = newMapObject.objectNumber;
            newMapObject.updateFrom( currentObjectOriginal );
            newMapObject.objectNumber = objectNumber;
            newMapObject.commit();

            if ( this.widgetProps.copyActionInfo.deleteOriginalObjectFlag ) {
                const vectorLayerOriginal = currentObjectOriginal.vectorLayer;
                if ( !vectorLayersSet.has( vectorLayerOriginal ) ) {
                    vectorLayerOriginal.startTransaction();
                    vectorLayersSet.add( vectorLayerOriginal );
                }
                currentObjectOriginal.delete();
            }
        } );

        await this.commitTransaction( vectorLayersSet, COPY_OBJECTS_ACTION );

        if ( this.widgetProps.copyActionInfo.deleteOriginalObjectFlag ) {
            this.map.removeSelectedObjects( currentObjectListForCopy );
        }
    }

    private async setCopyObjectOperation( operation: CopyObjectOperation ): Promise<void> {
        switch ( operation ) {
            case CopyObjectOperation.Yes:
                await this.copyObject( 1 );
                this.fillNextObjectForCopyInfo();
                break;
            case CopyObjectOperation.Skip:
                this.objectListForCopy.splice( 0, 1 );
                this.fillNextObjectForCopyInfo();
                break;
            case CopyObjectOperation.All:
                await this.copyObject( this.widgetProps.copyActionInfo.objectsCount );
                this.setPanelMessage( {
                    text: 'Objects copied: ',
                    value: '' + this.widgetProps.copyActionInfo.objectsCount,
                    isSnackbar: true
                } );
                this.fillNextObjectForCopyInfo();
                break;
            case CopyObjectOperation.Finish:
                this.resetCopyObjectsPanel();
                if ( this._action ) {
                    this.setAction( this._action.id, false );
                }
                break;
            default:
        }
    }

    setState<K extends keyof GwtkMapEditorTaskState>( key: K, value?: GwtkMapEditorTaskState[K] ) {
        switch ( key ) {
            case CREATE_OBJECT_ACTION:
            case CREATE_SUBOBJECT_ACTION:
            case EDIT_OBJECT_ACTION:
            case DELETE_OBJECT_ACTION:
            case EDIT_POINT_ACTION:
            case EDIT_SEGMENT_ACTION:
            case MERGE_OBJECTS_ACTION:
            case MOVE_OBJECTS_ACTION:
            case TRANSFORM_OBJECTS_ACTION:
            case COPY_OBJECTS_ACTION:
            case SPLIT_OBJECT_ACTION:
            case EDIT_ATTRIBUTES_ACTION:
                this.setAction( key, value as boolean );
                break;
            case UNDO_TRANSACTION:
                this.undoLastTransaction();
                break;
            case UNDO_TRANSACTION_FOR_LAYER:
                this.undoLastTransaction( this.widgetProps.selectedLayerXId );
                break;
            case REDO_TRANSACTION:
                this.redoTransaction();
                break;
            case SELECT_LAYOUT:
                this.selectLayout( value as string | undefined );
                break;
            case UPDATE_LAYOUT:
                this.updateLayoutFromLegend( value as string );
                break;
            case ACTION_COMMIT:
                if ( this._action ) {
                    this._action.commit();
                }
                break;
            case ACTION_CANCEL:
                if ( this._action ) {
                    this._action.revert();
                }
                break;
            case SELECT_LAYOUT_LAYER:
                // this.map.clearActiveObject();
                this.widgetProps.selectedLayerXId = value as string;
                this.widgetProps.layouts = this.getLayouts( this.widgetProps.selectedLayerXId ) || [];
                this.vectorLayer = this.map.vectorLayers.find( item => item.xId === this.widgetProps.selectedLayerXId );
                this.widgetProps.isLocalLayerSelected = this.vectorLayer?.serverUrl === 'localhost';
                this.widgetProps.isUndoForLayerDisabled = this.mapWindow.getTaskManager().getTransactionsCount( this.widgetProps.selectedLayerXId ) === 0;
                const layer = this.map.tiles.getLayerByxId(this.widgetProps.selectedLayerXId);
                if (layer) {
                    let layerListChangedFlag = false;
                    if (!layer.visibleFlag) {
                        this.map.setLayerVisibility(layer, true);
                        layerListChangedFlag = true;
                    }
                    if (!layer.visible) {
                        const node = this.map.contentTreeManager.getNode(layer.id);
                        if (node) {
                            this.map.contentTreeManager.enableParentNodes(node);
                            this.map.refresh();
                            layerListChangedFlag = true;
                        }
                    }
                    if (layerListChangedFlag) {
                        this.map.trigger({type: 'layerlistchanged', target: 'map'});
                    }
                }

                this.updateTransactionButtons();
                break;
            case SELECT_LAYER_FOR_COPY:
                this.widgetProps.copyActionInfo.selectedLayerXId = value as string;
                this.updateObjectListForCopy();
                break;
            case SET_COPY_OBJECT_PANEL_FINAL:
                this.fillNextObjectForCopyInfo();
                break;
            case SET_COPY_OBJECT_OPERATION:
                this.setCopyObjectOperation( value as CopyObjectOperation );
                break;
            case SET_COPY_OBJECT_DELETE_ORIGINAL:
                this.widgetProps.copyActionInfo.deleteOriginalObjectFlag = value as boolean;
                this.updateObjectListForCopy();
                break;
            case OPEN_PUBLISH_OBJECT_DIALOG:
                BrowserService.openFileDialog(ALLOWED_FILE_EXTENSIONS, true).then(fileList => {
                    this.onGeometryFilesUpload(fileList as FileList);
                }).catch(error => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mapeditor.Reading file error') + '!',
                        type: LogEventType.Error,
                        description: error,
                        display: true
                    });
                });
                break;
            case CREATE_OBJECT_FROM_OBJECT:
                const objectWithGeometry = value as MapObject | undefined;
                const currentObject = this.map.getActiveObject();
                if (currentObject && objectWithGeometry) {
                    currentObject.updateGeometryFrom(objectWithGeometry);
                    this.map.taskManagerNew.showObjectPanel(MapObjectPanelState.showEditor, true, [currentObject]);

                }
                break;
            case SET_OBJECT_EDITOR_DATA:
                this.objectEditorData = value as FeatureType | undefined;
                break;
            case CREATE_OBJECT_COMMIT:
                const mapObject = value as MapObject;
                const objectPanelState = this.objectEditorData ? [{key: 'gwtkmapobject.setmapobjecteditdata', value: this.objectEditorData}] : undefined;
                this.mapWindow.getTaskManager().showObjectPanelEdit(mapObject, objectPanelState);
                this.map.fitMapObject(mapObject);
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS:
                this.widgetProps.publishObject.mapObjectType = this.getMapObjectType();
                this.widgetProps.publishObject.objectName = this.getObjectName();
                this.getCrsList();
                this.widgetProps.publishObject.isManualInput = true;
                this.widgetProps.publishObject.coordinatesList.splice(0);
                this.widgetProps.publishObject.coordinatesList = GwtkMapEditorTask.getCoordinatesList(this.widgetProps.publishObject.mapObjectType);
                this.widgetProps.publishObject.buttonsActions = GwtkMapEditorTask.getButtonsActions();
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_X:
                {
                    const objectValue = value as { positionNumber: number, value: string};
                    this.widgetProps.publishObject.coordinatesList[objectValue.positionNumber].splice(0, 1, +objectValue.value);
                    if (this.widgetProps.publishObject.mapObjectType === MapObjectType.Polygon && objectValue.positionNumber === 0) {
                        const coordinatesListLastIndex = this.widgetProps.publishObject.coordinatesList.length - 1;
                        this.widgetProps.publishObject.coordinatesList[coordinatesListLastIndex].splice(0, 1, +objectValue.value);
                    }
                }
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_Y:
                {
                    const objectValue = value as { positionNumber: number, value: string };
                    this.widgetProps.publishObject.coordinatesList[objectValue.positionNumber].splice(1, 1, +objectValue.value);
                    if (this.widgetProps.publishObject.mapObjectType === MapObjectType.Polygon && objectValue.positionNumber === 0) {
                        const coordinatesListLastIndex = this.widgetProps.publishObject.coordinatesList.length - 1;
                        this.widgetProps.publishObject.coordinatesList[coordinatesListLastIndex].splice(1, 1, +objectValue.value);
                    }
                }
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_CHANGE_POINT_HEIGHT:
                {
                    const objectValue = value as { positionNumber: number, value: string };
                    this.widgetProps.publishObject.coordinatesList[objectValue.positionNumber].splice(2, 1, +objectValue.value);
                    if (this.widgetProps.publishObject.mapObjectType === MapObjectType.Polygon && objectValue.positionNumber === 0) {
                        const coordinatesListLastIndex = this.widgetProps.publishObject.coordinatesList.length - 1;
                        this.widgetProps.publishObject.coordinatesList[coordinatesListLastIndex].splice(2, 1, +objectValue.value);
                    }
                }
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_ADD_POINT:
                if (this.widgetProps.publishObject.mapObjectType === MapObjectType.Polygon) {
                    const coordinatesListLastIndex = this.widgetProps.publishObject.coordinatesList.length - 1;
                    this.widgetProps.publishObject.coordinatesList.splice(coordinatesListLastIndex, 0, [0, 0, 0]);
                } else {
                    this.widgetProps.publishObject.coordinatesList.push([0, 0, 0]);
                }
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_REMOVE_POINT:
                {
                    this.widgetProps.publishObject.coordinatesList.splice(value as number, 1);
                }
                break;

            case CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_OK:
                this.widgetProps.publishObject.isManualInput = false;
                const crs: CRS = {
                    type: 'name',
                    properties: {
                        name: 'EPSG:' + this.widgetProps.publishObject.crsList.select,
                    }
                };
                const json: GeoJsonType = {
                    type: 'FeatureCollection',
                    crs: crs,
                    features: this.addFeatureList(this.widgetProps.publishObject.coordinatesList as Vector3D[]),
                };
                this.filesList = this.createFileList(this.saveGeoJSONToFile(json));
                this.widgetProps.publishObject.coordinatesList.splice(0);
                this.setState(CLICK_PUBLISH_OBJECT_BUTTON_OK, undefined);
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_BUTTON_CANCEL:
                this.widgetProps.publishObject.isManualInput = false;
                this.setState(ACTION_CANCEL, undefined);
                break;
            case SET_PUBLISH_OBJECT_CRS:
                this.widgetProps.publishObject.crsList.select = value as string;
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_REVERSE_DIRECTION:
                this.widgetProps.publishObject.coordinatesList.reverse();
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_IMPORT_FROM_JSON_FILE:
                BrowserService.openFileDialog(ALLOWED_JSON_EXTENSIONS).then(fileList => {
                    if (fileList) {
                        this.readJsonFile(fileList);
                    }
                }).catch(error => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mapeditor.Reading file error') + '!',
                        type: LogEventType.Error,
                        description: error,
                        display: true
                    });
                });
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_EXPORT_TO_JSON_FILE:
                {
                    const crs: CRS = {
                        type: 'name',
                        properties: {
                            name: 'EPSG:' + this.widgetProps.publishObject.crsList.select,
                        }
                    };
                    const json: GeoJsonType = {
                        type: 'FeatureCollection',
                        crs: crs,
                        features: this.addFeatureList(this.widgetProps.publishObject.coordinatesList as Vector3D[]),
                    };
                    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
                    BrowserService.downloadContent( blob, (this.widgetProps.publishObject.objectName) || 'Temporary' +'.json'  );
                }
                break;
            case CREATE_OBJECT_MANUAL_INPUT_COORDS_FILL_COORD_TABLE:
                {
                    const json = value as string;
                    const geoJSON = new GeoJSON(json);
                    const geometry = geoJSON.getFeature(0)?.getLineGeometryCoordinates();
                    if (geometry) {
                        this.widgetProps.publishObject.coordinatesList.splice(0);
                        this.widgetProps.publishObject.coordinatesList.push(...geometry);
                        //ограничим количество координат для точечного объекта
                        if (this.widgetProps.publishObject.mapObjectType === MapObjectType.Point && this.widgetProps.publishObject.coordinatesList.length > 1) {
                            this.widgetProps.publishObject.coordinatesList.splice(1);
                            this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.The first point is selected for the point object'));
                        }
                    }
                }
                break;
            case CLICK_PUBLISH_OBJECT_BUTTON_OK:
                this.publishObject();
                break;
            case CLICK_PUBLISH_OBJECT_BUTTON_CANCEL:
                this.widgetProps.publishObject.isPublished = false;
                this.setState(ACTION_CANCEL, undefined);
                break;
            case START_WAIT_CAPTURING:
                this.widgetProps.isWaitCapturing = true;
                break;
            case STOP_WAIT_CAPTURING:
                this.map.searchManager.stopSearch();
                this.widgetProps.isWaitCapturing = false;
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }

    publishObject() {
        if ( this.filesList && this.filesList.length > 1) {
            this.createZipArchive(this.filesList).then(result => {
                if (result) {
                    this.uploadFile(result);
                }
            }).catch((error) => {
                const gwtkError = new GwtkError(error);
                const description = gwtkError.message;
                this.map.writeProtocolMessage({ text: gwtkError.name, description, type: LogEventType.Error });
            });
        } else {
            if ( this.filesList ) {
                this.uploadFile(this.filesList[0]);
            }
        }
        this.widgetProps.publishObject.isPublished = false;
    }

    /**
     * Чтение JSON файла
     * @private
     * @method readJsonFile
     * @param fileList {FileList} объект FileList
     */
    private readJsonFile(fileList: FileList) {
        if (fileList[0]) {
            const file = fileList[0];
            if (file.type == 'application/json') {
                const fileReader = new FileReader();
                fileReader.onload = (e) => {
                    if (e.target && typeof e.target.result === 'string') {
                        this.setState(CREATE_OBJECT_MANUAL_INPUT_COORDS_FILL_COORD_TABLE, e.target.result);
                    } else {
                        this.map.writeProtocolMessage({
                            text: i18n.tc('mapeditor.Reading file error') + '!',
                            type: LogEventType.Error,
                            display: true
                        });
                        this.setState(ACTION_CANCEL, undefined);
                    }
                };
                fileReader.onerror = (error => {
                    const gwtkError = new GwtkError(error);
                    this.map.writeProtocolMessage({
                        text: i18n.tc('mapeditor.Reading file error') + '!',
                        description: gwtkError.toString(),
                        type: LogEventType.Error,
                        display: true
                    });
                    this.setState(ACTION_CANCEL, undefined);
                });
                fileReader.readAsText(file);
            } else {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.Select json file type'));
            }
        }
    }

    /**
     * Формирует первоначальный массив координат в зависимости от типа объекта
     * @private
     * @static
     * @method getCoordinatesList
     * @param mapObjectType {MapObjectType} тип объекта карты
     * @return {Vector2or3[]} массив координат
     */
    private static getCoordinatesList(mapObjectType: MapObjectType) {
        const coordinatesList: Vector2or3[] = [];
        switch (mapObjectType) {
            case MapObjectType.Point:
                coordinatesList.push([0, 0, 0]);
                break;
            case MapObjectType.LineString:
                coordinatesList.push([0, 0, 0]);
                coordinatesList.push([0, 0, 0]);
                break;
            case MapObjectType.Polygon:
                coordinatesList.push([0, 0, 0]);
                coordinatesList.push([0, 0, 0]);
                coordinatesList.push([0, 0, 0]);
                coordinatesList.push([0, 0, 0]);
                break;
        }
        return coordinatesList;
    }

    /**
     * Формирует кнопки меню создания объекта в МСК
     * @private
     * @static
     * @method getButtonsActions
     * @returns {ButtonsList[]} массив кнопок меню
     */
    private static getButtonsActions() {
        const buttonsAction: ButtonsList = [];

        buttonsAction.push({
            text: i18n.tc('mapeditor.Reverse direction'),
            value: CREATE_OBJECT_MANUAL_INPUT_COORDS_REVERSE_DIRECTION,
            enable: true,
        });
        buttonsAction.push({
            text: i18n.tc('mapeditor.Import from JSON file'),
            value: CREATE_OBJECT_MANUAL_INPUT_COORDS_IMPORT_FROM_JSON_FILE,
            enable: true,
        });
        buttonsAction.push({
            text: i18n.tc('mapeditor.Export to JSON file'),
            value: CREATE_OBJECT_MANUAL_INPUT_COORDS_EXPORT_TO_JSON_FILE,
            enable: true,
        });
        return buttonsAction;
    }

    /**
     * Заполнение feature для GeoJSON
     * @private
     * @method addFeatureList
     * @param coordinates {Vector3D[]} массив триплета координат
     * @return {FeatureType[]} массив FeatureType
     */
    private addFeatureList(coordinates: Vector3D[]): FeatureType[] {
        const feature: FeatureType[] = [{
            type: 'Feature',
            geometry: { type: MapObjectType.Point, coordinates: [0, 0, 0] },
            properties: {
                local: LOCALE.Point,
            }
        }];
        switch (this.widgetProps.publishObject.mapObjectType) {
            case MapObjectType.Point:
                if (coordinates[0].length > 2 ) {
                    feature[0].geometry.coordinates.splice(0);
                    feature[0].geometry.coordinates.splice(0, 1, coordinates[0][0]);
                    feature[0].geometry.coordinates.splice(1, 1, coordinates[0][1]);
                    feature[0].geometry.coordinates.splice(2, 1, coordinates[0][2]);
                }
                break;
            case MapObjectType.LineString:
                feature[0].geometry.type = MapObjectType.LineString;
                feature[0].geometry.coordinates.splice(0);
                coordinates.forEach((coord, index) => feature[0].geometry.coordinates.splice(index, 1, coord));
                feature[0].properties.local = LOCALE.Line;
                break;
            case MapObjectType.Polygon:
                feature[0].geometry.type = MapObjectType.Polygon;
                feature[0].geometry.coordinates.splice(0, 4, coordinates);
                feature[0].properties.local = LOCALE.Plane;
                break;
        }
        return feature;
    }

    /**
     * Создание объекта типа FileList
     * @private
     * @method createFileList
     * @param file {File} объект File
     * @return {FileList} объект FileList
     */
    private createFileList(file: File): FileList {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        return dataTransfer.files;
    }

    /**
     * Сохранение объекта GeoJsonType в файл JSON
     * @private
     * @method saveGeoJSONToFile
     * @param geoJSONData {GeoJsonType}
     * @param fileName {string} имя файла
     * @return {File} объект File
     */
    private saveGeoJSONToFile(geoJSONData: GeoJsonType, fileName: string = 'Temporary') {
        const blob = new Blob([JSON.stringify(geoJSONData)], { type: 'application/json' });
        return new File([blob], fileName + '.json', {type: 'application/json'});
    }

    /**
     * Установить состояние обработчика
     * @private
     * @method setAction
     * @param id {string} Идентификатор обработчика
     * @param active {boolean} Флаг - включить(true)/выключить(false)
     */
    private setAction( id: string, active: boolean ) {
        if ( active ) {
            this.doAction( id );
        } else {
            this.quitAction( id );
        }
    }

    /**
     * Применить транзакцию
     * @method commitTransaction
     * @param vectorLayers {VectorLayer[]} Массив слоёв
     * @param actionId {string} Идентификатор действия
     */
    async commitTransaction( vectorLayers: Iterable<VectorLayer>, actionId: string ) {

        this.actionIdCurrent = actionId;

        let undoNeed = false;
        const commitList: TransactionData['commitList'] = [];

        for ( let vectorLayer of vectorLayers ) {

            try {
                const response = await vectorLayer.commitTransaction();

                let transactionNumber = '';
                const outParams = response.outparams;
                const index = outParams.findIndex((item) => item.name === 'TransactionNumber');
                if (index > -1) {
                    transactionNumber = outParams[index].value;
                }

                commitList.push({ xId: vectorLayer.xId, transactionNumber });

            } catch (error) {
                undoNeed = true;
                break;
            }
        }

        if ( !undoNeed ) {

            const transactionData: TransactionData = {
                id: Utils.generateGUID(),
                actionId,
                commitList,
                timeStamp: Date.now()
            };

            this.mapWindow.getTaskManager().addTransaction( transactionData );

        } else {
            commitList.forEach( item => {
                const vectorLayer = this.map.getVectorLayerByxId( item.xId );
                if ( vectorLayer instanceof GISWebServiceVectorLayer ) {
                    vectorLayer.undoTransaction();
                }
            } );
        }


    }

    async undoTransactionPrepare( xId?: string ): Promise<boolean | undefined> {

        const lastTransaction = this.mapWindow.getTaskManager().getLastTransaction( xId );
        if ( lastTransaction ) {
            let needConfirm = false;

            for ( let i = 0; i < lastTransaction.commitList.length; i++ ) {
                const commitItem = lastTransaction.commitList[ i ];
                const vectorLayer = this.map.getVectorLayerByxId( commitItem.xId );
                if ( vectorLayer instanceof GISWebServiceVectorLayer ) {
                    const transactions = await vectorLayer.getTransactionListForDay();
                    const layerTransactionNumberList = transactions.map( item => item.number );

                    this.mapWindow.getTaskManager().updateLayerTransactions( vectorLayer.xId, layerTransactionNumberList );

                    const index = layerTransactionNumberList.findIndex( layerTransactionNumber => layerTransactionNumber === commitItem.transactionNumber );
                    if ( index !== layerTransactionNumberList.length - 1 ) {
                        needConfirm = true;
                    }
                }
            }

            const newLastTransaction = this.mapWindow.getTaskManager().getLastTransaction( xId );
            if ( !newLastTransaction ) {
                return undefined;
            }

            if ( newLastTransaction.id !== lastTransaction.id ) {
                return this.undoTransactionPrepare( xId );
            }

            return needConfirm;
        }

    }

    /**
     * Отменить последнюю транзакцию
     * @private
     * @method undoLastTransaction
     */
    async undoLastTransaction( xId?: string ) {

        if ( this._action ) {
            this.setAction( this._action.id, false );
        }

        const needConfirm = await this.undoTransactionPrepare( xId );

        if ( needConfirm === undefined ) {
            this.map.writeProtocolMessage( {
                text: i18n.t( 'mapeditor.Transaction is not in log' ) + '',
                type: LogEventType.Info,
                display: true
            } );
        }

        if ( needConfirm ) {
            this.mapWindow.showInputText( {
                description: i18n.t( 'mapeditor.Several recent transactions will be undone' ) + ''
            } ).then( () => {

                this.undoTransactionConfirmed( xId );

            } ).catch( e => e && console.log( e ) );
        } else {
            this.undoTransactionConfirmed( xId );
        }

    }

    async undoTransactionConfirmed( xId?: string ) {
        const transactionData = this.mapWindow.getTaskManager().getLastTransaction( xId );
        if ( transactionData ) {
            for ( let i = 0; i < transactionData.commitList.length; i++ ) {
                const vectorLayer = this.map.getVectorLayerByxId( transactionData.commitList[ i ].xId );
                if ( vectorLayer && (vectorLayer instanceof GISWebServiceVectorLayer) ) {
                    //TODO { транзакции отменяются по журналу с конца до текущей включительно,
                    // пока undoLastTransaction() не принимает номер текущей транзакции слоя для отмены
                    const transactions = await vectorLayer.getTransactionListForDay();
                    const layerTransactionIdList = transactions.map( item => item.number );

                    for ( let j = layerTransactionIdList.length - 1; j >= 0; j-- ) {

                        await vectorLayer.undoTransaction();

                        if ( layerTransactionIdList[ j ] === transactionData.commitList[ i ].transactionNumber ) {
                            break;
                        }
                    }//TODO }
                }
            }
            this.mapWindow.getTaskManager().addTransactionToRedoList( transactionData );
        }
    }

    /**
     * Восстановить последнюю отменённую транзакцию
     * @private
     * @method redoTransaction
     */
    async redoTransaction() {

        if ( this._action ) {
            this.setAction( this._action.id, false );
        }

        const transactionData = this.mapWindow.getTaskManager().getLastUndoneTransaction();
        if ( transactionData ) {
            for ( let i = 0; i < transactionData.commitList.length; i++ ) {
                const vectorLayer = this.map.getVectorLayerByxId( transactionData.commitList[ i ].xId );
                if ( vectorLayer && (vectorLayer instanceof GISWebServiceVectorLayer) ) {
                    await vectorLayer.redoTransaction();
                    const transactions = await vectorLayer.getTransactionListForDay();
                    if ( transactions && transactions.length > 0 ) {
                        transactionData.commitList[ i ].transactionNumber = transactions[ transactions.length - 1 ].number;
                    }
                }
            }
            this.mapWindow.getTaskManager().addTransaction( transactionData );
        }
    }

    /**
     * Получить описание шаблона объекта
     * @async
     * @method getMapObjectDescription
     * @param actionId {string} Идентификатор обработчика
     */
    async getMapObjectDescription( actionId: string ) {
        if ( this.activeMapObjectDescriptionId ) {
            return this.getLayoutDescription( this.widgetProps.selectedLayerXId, this.activeMapObjectDescriptionId );
        } else {
            return this.callLegend( actionId );
        }
    }

    /**
     * Запросить легенду
     * @async
     * @method callLegend
     * @param actionId {string} Идентификатор обработчика
     */
    async callLegend( actionId: string ) {
        try {
            const result = await this.mapWindow.getTaskManager().callLegend(this.widgetProps.selectedLayerXId) as EditorLayoutDescription;
            if (result && this.getActionDescription(actionId)?.active) {
                const vectorLayer = this.map.vectorLayers.find(item => item.idLayer === result.objectDescription.mapid);
                if (vectorLayer) {
                    this.setLayoutDescription(vectorLayer.id, '', result);
                }
                return result;
            }
        } catch (error) {
            const gwtkError = new GwtkError(error);
            throw Error(gwtkError.message);
        }
    }

    /**
     * Выбор шаблона
     * @async
     * @method selectLayout
     * @param id {string} Идентификатор шаблона
     */
    async selectLayout( id?: string ) {
        if ( !id ) {
            this.activeMapObjectDescriptionId = undefined;
            return;
        }
        const layoutDescription = this.getLayoutDescription( this.widgetProps.selectedLayerXId, id );
        if ( !layoutDescription ) {
            return await this.updateLayoutFromLegend( id );
        } else {
            this.setState( CREATE_OBJECT_ACTION, false );
            this.activeMapObjectDescriptionId = id;
            this.setAction( CREATE_OBJECT_ACTION, true );
        }

    }

    async updateLayoutFromLegend( id: string ) {
        try {
            const result = await this.mapWindow.getTaskManager().callLegend(this.widgetProps.selectedLayerXId) as EditorLayoutDescription;
            if (result) {
                const vectorLayer = this.map.vectorLayers.find(item => item.idLayer === result.objectDescription.mapid);
                if (vectorLayer) {
                    this.setLayoutDescription(vectorLayer.id, id, result);
                }
            }
        } catch (error) {
            error;
        }
    }

    setPanelMessage( message: MessageParameter ) {

        const messageString = i18n.t( 'mapeditor.' + message.text ) + (message.value ? message.value : '');

        if ( message.isSnackbar ) {
            this.setMessage( messageString );
        } else {
            this.widgetProps.actionMessage = messageString;
        }
    }

    resetMessage() {
        this.widgetProps.actionMessage = undefined;
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        const layerIdSearchCriterion = criteriaAggregator.getLayerIdSearchCriterion();
        const layer = this.map.getVectorLayerByxId( this.widgetProps.selectedLayerXId );
        if ( layer && layer.isEditable ) {
            layerIdSearchCriterion.setValue( layer.idLayer );
        } else {
            layerIdSearchCriterion.setValue( '' );
        }
    }

    /**
     * Получить список шаблонов
     * @method getLayouts
     * @param xId {string} Идентификтаор слоя
     * @return {array} Массив шаблонов
     */
    getLayouts( xId: string ) {
        const layoutsList = this.workspaceData.layoutsList;

        let id = xId;
        if ( this.map.getVectorLayerByxId( xId ) instanceof GeoJsonLayer ) {
            id = '';
        }
        const layoutsItem = layoutsList.find( item => item.id === id );
        if ( layoutsItem ) {
            if ( this.map.getVectorLayerByxId( xId ) instanceof GeoJsonLayer ) {
                layoutsItem.layouts.forEach( ( layout ) => layout.description && (layout.description.layerXid = xId) );
            }
            return layoutsItem.layouts;
        }
    }

    /**
     * Получить описание шаблона
     * @method getLayoutDescription
     * @param xId {string} Идентификатор слоя
     * @param layoutId {string} Идентификатор шаблона
     * @return {object} Описание шаблона
     */
    getLayoutDescription( xId: string, layoutId: string ) {
        const layouts = this.getLayouts( xId );
        if ( layouts ) {
            const layout = layouts.find( item => item.id === layoutId );
            if ( layout ) {
                return layout.description;
            }
        }
    }

    /**
     * Установить описание шаблона
     * @method getLayoutDescription
     * @param xId {string} Идентификатор слоя
     * @param layoutId {string} Идентификатор шаблона
     * @param layoutDescription {EditorLayoutDescription} Описание шаблона
     */
    setLayoutDescription( xId: string, layoutId: string, layoutDescription: EditorLayoutDescription | null ) {
        let layouts = this.getLayouts( xId );

        if ( !layouts ) {
            layouts = [];
            this.workspaceData.layoutsList.push( { id: xId, layouts } );
        }

        let layout = layouts.find( item => item.id === layoutId );
        if ( layout ) {
            layout.description = layoutDescription;
        } else {
            //Проверяем, нет ли такого же шаблона
            layout = layouts.find(item => {
                if (
                    layoutDescription &&
                    item.description &&
                    item.description.layerXid === layoutDescription.layerXid &&
                    item.description.drawingType === layoutDescription.drawingType&&
                    item.description.mapObjectType === layoutDescription.mapObjectType
                ) {
                    return item.description.objectDescription.key === layoutDescription.objectDescription.key ||
                        (item.description.objectDescription.code === layoutDescription.objectDescription.code &&
                            item.description.objectDescription.local === layoutDescription.objectDescription.local);
                }
            });

            //Добавляем новый шаблон в начало списка, последний будет всегда замещаться
            if (!layout) {
                for (let i = layouts.length - 1; i > 0; i--) {
                    layouts[i].description=layouts[i-1].description;
                }
                layouts[0].description = layoutDescription;
            }

        }

        this.saveLayouts();
    }

    /**
     * Сбросить описание шаблона
     * @method getLayoutDescription
     * @param xId {string} Идентификатор слоя
     * @param layoutId {string} Идентификатор шаблона
     */
    clearLayoutDescription( xId: string, layoutId: string ) {
        const layouts = this.getLayouts( xId );
        if ( layouts ) {
            const layout = layouts.find( item => item.id === layoutId );
            if ( layout ) {
                layout.description = null;
                this.saveLayouts();
            }
        }
    }

    private saveLayouts() {
        this.writeWorkspaceData( true );
    }

    private onGeometryFilesUpload(fileList: FileList) {
        if (fileList[0]) {
            this.widgetProps.publishObject.mapName = this.getFileName(fileList);
            this.getCrsList();
            this.filesList = fileList;
            this.widgetProps.publishObject.isPublished = true;
        }
    }

    /**
     * Загружает файл карты на сервер
     * @private
     * @method uploadFile
     * @param file {File}
     */
    private uploadFile(file: File) {
        this.setState(START_WAIT_CAPTURING, undefined);
        const uploader = new FileUploader(file, { url: this.map.options.url });
        uploader.upload();
        this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Uploading a file to the server'));
        uploader.onSuccess((res: UploadFileResponse['restmethod']) => {
            this.uploadLink = res.file.path;
            this.loadData();
            this.setState(STOP_WAIT_CAPTURING, undefined);
        });
        uploader.onError(() => {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapcontent.Error uploading a file to the server') + '!',
                type: LogEventType.Error,
                display: true
            });
            this.setState(STOP_WAIT_CAPTURING, undefined);
        });
    }

    /**
     * Создание пользовательского слоя по файлу MIF, MID, SHP, DXF
     * @private
     * @method loadData
     */
    private loadData() {
        this.setState(START_WAIT_CAPTURING, undefined);

        const serviceUrl = GWTK.Util.getServerUrl(this.map.options.url);
        const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        let request, cancellableRequest;

        const options: LoadData = {
            XSDNAME: /\.zip$/i.test(this.uploadLink) ? '' : 'service',
            LAYERNAME: 'TempLayer',
            CRS: (this.getCrsName() != '') ? this.getCrsName() : this.map.getCrsString(),
            CREATEMAPSCALE: this.publishMapScale,
            FILENAME: this.uploadLink,
            DELIMITERSYMBOL: ';'
        };

        request = service.loadData.bind(service);
        cancellableRequest = RequestService.sendCancellableRequest(request, options, httpParams);

        cancellableRequest.promise.then(response => {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapcontent.Publishing a map'));
            if (response.data) {
                const status = response.data.restmethod.outparams.status;
                if (status === 'Accepted') {
                    this.jobId = response.data.restmethod.outparams.jobId;
                }
            }
            if (this.jobId !== undefined) {
                this.getStatusResponse(this.jobId, serviceUrl);
            }

            this.setState(STOP_WAIT_CAPTURING, undefined);
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapeditor.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });

            this.setState(STOP_WAIT_CAPTURING, undefined);
        });

    }

    /**
     * Получить информацию о статусе асинхронного процесса
     * @private
     * @method getStatusResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     */
    private getStatusResponse(processId: string, serviceUrl: string) {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        window.setTimeout(async () => {
            const request = service.getAsyncStatusData.bind(service) as () => Promise<ServiceResponse<GetStatusDataResponse>>;
            const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
            try {

                this.setState(START_WAIT_CAPTURING, undefined);

                const response = await cancellableRequest.promise;
                if (response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    if (statusMessage === 'Accepted' || statusMessage === 'Running') {
                        return this.getStatusResponse(processId, serviceUrl);
                    } else if (statusMessage === 'Succeeded') {
                        processId = response.data.restmethod.outparams.jobId;
                    } else if (statusMessage === 'Failed') {
                        this.map.writeProtocolMessage(
                            {
                                text: i18n.tc('mapeditor.Error executing query') + '!',
                                type: LogEventType.Error,
                                display: true
                            }
                        );
                        return;
                    }
                }
                if (processId !== undefined && response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    this.processResponse(processId, serviceUrl, statusMessage);
                }

                this.setState(STOP_WAIT_CAPTURING, undefined);
            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('mapeditor.Error executing query'),
                    display: true,
                    description: gwtkError.message,
                    type: LogEventType.Error
                });

                this.setState(STOP_WAIT_CAPTURING, undefined);
            }
        }, 1000);
    }

    /**
     * Обработать промежуточный этап поиска
     * @private
     * @method processResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     * @param statusMessage {string} Сообщение от сервера
     */
    private processResponse(processId: string, serviceUrl: string, statusMessage: string) {
        const service = RequestServices.getService(serviceUrl, ServiceType.REST);
        const request = service.getAsyncResultData.bind(service) as () => Promise<ServiceResponse<GetLoadDataResponse>>;
        const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
        cancellableRequest.promise.then((result:ServiceResponse<GetLoadDataResponse>) =>{
            if (result.data) {
                this.setState(PUBLISH_OBJECT_FROM_FILE_DATA, result);
            } else if (result.error) {
                const gwtkError = new GwtkError(result.error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('mapeditor.Error executing query'),
                    description: gwtkError.message,
                    display: true,
                    type: LogEventType.Error
                });
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapeditor.Error executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
        });
    }

    /**
     * Сформировать архив из файлов
     * @private
     * @method createZipArchive
     * @param files {File[]}
     */
    private async createZipArchive(files: FileList): Promise<File> {
        const zip = new JSZip();
        let fileName = '';
        for (let file of files) {
            zip.file(file.name, file);

            const rule = ALLOWED_FILE_EXTENSIONS.map(item => '\\' + item).join('|');
            const re = new RegExp(`(${rule})`, 'i');

            if (fileName === '' && re.test(file.name)) {
                fileName = file.name;
            }
        }
        try {
            const content = await zip.generateAsync({
                type: 'blob', compression: 'DEFLATE',
                compressionOptions: {
                    level: 7
                }
            });
            //преобразуем Blob в объект типа File
            return new File([content], fileName + '.zip', { type: 'application/zip' });
        } catch (error) {
            throw new GwtkError(error);
        }
    }

    /**
     * Получить список референсных систем координат CRS
     * @private
     * @method getCrsList
     */
    private getCrsList() {
        const httpParams = RequestServices.createHttpParams(this.map);
        const service = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);
        service.getCrsList().then((result: ServiceResponse) => {
            if (result.data) {
                const xml = ParseTextToXml(result.data);
                const crsValues = this.collectCrsValues(xml);
                if (crsValues) {
                    this.widgetProps.publishObject.crsList.list.push(...crsValues);
                    this.widgetProps.publishObject.crsList.select = this.widgetProps.publishObject.crsList.list[0].epsg;
                }
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('mapeditor.Error getting CRS list'),
                display: true,
                description: error.message,
                type: LogEventType.Error
            });
        });
    }

    /**
     * Получить список значений CRS
     * @private
     * @param element {XMLElement}
     * @method collectCrsValues
     * @return {CrsItem[]}
     */
    private collectCrsValues(element: XMLElement): CrsItem[] {
        const crsList: CrsItem[] = [];
        const crsElement = element.findByTag('ProjectList');
        if (crsElement && crsElement.children.length) {
            const validCrsChildren = crsElement.children.filter(child => child.attributes.EPSG && child.attributes.EPSG !== '');
            validCrsChildren.forEach(xmlElement => crsList.push({
                epsg: xmlElement.attributes.EPSG.trim(),
                name: xmlElement.attributes.Name ? xmlElement.attributes.Name.trim() : '',
                comment: xmlElement.attributes.Comment ? xmlElement.attributes.Comment.trim() : ''
            }));
        }
        return crsList;
    }

    /**
     * Получить имя выбраного CRS регистра
     * @method getCrsName
     */
    getCrsName() {
        return 'EPSG:' + this.widgetProps.publishObject.crsList.select;
    }

    /**
     * Получить имя файла из списка файлов
     * @private
     * @method getFileName
     * @param fileList {FileList}
     */
    private getFileName(fileList: FileList) {
        let fileName = '';
        for(let fileItem of fileList) {
            const rule = ALLOWED_FILE_EXTENSIONS.map(item => '\\' + item).join('|');
            const re = new RegExp(`(${rule})`, 'i');
            if (fileName === '' && re.test(fileItem.name)) {
                fileName = fileItem.name.replace(re, '');
            }
        }
        return fileName;
    }

    openAttributesEditor() {
        const activeObject = this.map.getActiveObject();
        if (activeObject) {
            this.map.taskManagerNew.showObjectPanel(MapObjectPanelState.showEditor, true);
        } else {
            this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.No active object'));
        }
    }
}
