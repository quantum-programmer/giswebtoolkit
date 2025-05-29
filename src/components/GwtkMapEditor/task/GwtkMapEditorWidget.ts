/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                     Виджет задачи редактора                      *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    STOP_WAIT_CAPTURING,
    COPY_OBJECTS_ACTION,
    CopyActionInfo,
    GwtkMapEditorTaskState,
    PublishObject,
    REDO_TRANSACTION,
    SELECT_LAYOUT,
    SELECT_LAYOUT_LAYER,
    UNDO_TRANSACTION,
    UNDO_TRANSACTION_FOR_LAYER,
    UPDATE_LAYOUT
} from '../task/GwtkMapEditorTask';
import { ActionMode, ActionModePanel, MODE_PANEL_KEYS, SAVE_PANEL_ID } from '~/taskmanager/Action';
import { EditorLayoutDescription } from '~/types/Types';
import GwtkCopyObjectsMode from '../task/components/GwtkCopyObjectsMode.vue';
import GwtkMapEditorObjectPublish from '../task/components/GwtkMapEditorObjectPublish/GwtkMapEditorObjectPublish.vue';
import GwtkMapEditorManualInputCoords from '../task/components/GwtkMapEditorManualInputCoords/GwtkMapEditorManualInputCoords.vue';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';


/**
 * Виджет компонента
 * @class GwtkMapEditorWidget
 * @extends BaseGwtkVueComponent
 */
@Component({ components: { GwtkCopyObjectsMode, GwtkMapEditorObjectPublish, GwtkMapEditorManualInputCoords } })
export default class GwtkMapEditorWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly buttons!: TaskDescription[];

    @Prop({ default: () => ({}) })
    private readonly modePanel!: ActionModePanel;

    @Prop({ default: () => ([]) })
    private readonly layouts!: { id: string; description: EditorLayoutDescription | null; };

    @Prop({ default: () => ([]) })
    private readonly layerItems!: { id: string; text: string; }[];

    @Prop({ default: '' })
    private readonly selectedLayerXId!: string;

    @Prop({ default: undefined })
    private readonly actionMessage?: string;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapEditorTaskState>(key: K, value: GwtkMapEditorTaskState[K]) => void;

    @Prop({ default: true })
    private readonly isUndoForLayerDisabled!: boolean;

    @Prop({ default: true })
    private readonly isLocalLayerSelected!: false;

    @Prop({ default: () => ({}) })
    private readonly copyActionInfo!: CopyActionInfo;

    @Prop({ default: () => ({}) })
    private readonly publishObject!: PublishObject;

    @Prop({ default: false })
    private readonly isWaitCapturing!: boolean;

    private layoutsEditMode = false;

    checkExpansionPanelButton(id: string) {
        return id !== UNDO_TRANSACTION && id !== REDO_TRANSACTION;
    }

    checkCopyObjectWidget(id: string): boolean {
        return id === COPY_OBJECTS_ACTION;
    }

    get modePanelDescriptions() {
        const result: ActionMode[] = [];

        MODE_PANEL_KEYS.forEach((key) => {
            const modePanel = this.modePanel[key];
            if (modePanel !== undefined) {
                if (!(!this.$vuetify.breakpoint.smAndUp && key === SAVE_PANEL_ID)) {
                    result.push(modePanel);
                }
            }
        });
        return result;
    }

    get hideContent() {
        return this.actionMessage === undefined && this.modePanelDescriptions.filter(modePanelDescription => modePanelDescription.enabled && modePanelDescription.visible).length === 0;
    }

    activateAction(button: TaskDescription) {
        this.setState(button.id as keyof GwtkMapEditorTaskState, !button.active);

    }

    selectLayout(id: string) {
        if (this.layoutsEditMode) {
            this.setState(UPDATE_LAYOUT, id);
        } else {
            this.setState(SELECT_LAYOUT, id);
        }
    }

    selectLayoutLayerXId(id: string) {
        this.setState(SELECT_LAYOUT_LAYER, id);
    }

    toggleUndoForSelectedLayer() {
        this.setState(UNDO_TRANSACTION_FOR_LAYER, undefined);
    }

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    get layoutsAreHidden() {
        const editorSettings = this.mapVue.getMap().getEditableLayersOptions();
        if (editorSettings) {
            return !!editorSettings.hideLayouts;
        }
        return false;
    }

    stopWaitCapturing() {
        this.setState(STOP_WAIT_CAPTURING, undefined);
    }

    isOperationEnabled(operation: 'edit' | 'create' | 'delete'): boolean {
        let result = false;
        const functions = this.mapVue.getMap().options.settings_mapEditor?.functions;
        if (functions) {
            result = functions.includes('*') || functions.includes(operation);
        }
        return result;
    }

}
