import { Component, Prop } from 'vue-property-decorator';
import BaseMapContentView from '../BaseMapContentView';
import { CALL_MAP_LEGEND_COMPONENT, CLICK_LAYER_STYLES_SETTINGS_CANCEL, CLICK_LAYER_STYLES_SETTINGS_OK, CLICK_LAYER_STYLES_SETTINGS_RETURN, GwtkMapContentTaskState, RESET_SLD_TEMPLATE, SAVE_SLD_TEMPLATE, SldWidgetObject, TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE } from '../../GwtkMapContentTask';
import { MarkerIcon, MarkerImageCategory, MapMarkersCommandsFlags, GwtkMapLegendItemReduced } from '~/types/Types';
import GwtkMapContentPublishMapAddSldScheme from '../GwtkMapContentPublishMap/GwtkMapContentPublishMapAddSldScheme/GwtkMapContentPublishMapAddSldScheme.vue';
import { GwtkMapLegendItem } from '@/components/GwtkMapLegend/task/components/LegendItems';


@Component({
    components: {
        GwtkMapContentPublishMapAddSldScheme
    }
})
export default class GwtkMapContentLayerStylesSettings extends BaseMapContentView {

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    @Prop({ default: () => ([]) })
    readonly selectedLegendObjectList!:  GwtkMapLegendItemReduced [];

    @Prop( {  default: () => ({})  } )
    readonly sldObject!:SldWidgetObject;

    @Prop({ default: () => ([]) })
    readonly markerImageList!: MarkerIcon[];

    @Prop({ default: () => ([]) })
    readonly markerCategoryList!: MarkerImageCategory[];

    @Prop({ default: () => ({}) })
    readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    @Prop({ default: '' })
    readonly layerNodeId!: string;

    isOpenSldEditor: boolean = false;

    private toggleSldEditorState() {
        this.isOpenSldEditor = !this.isOpenSldEditor;
    }

    private saveSldTemplate() {
        this.toggleSldEditorState();
        this.setState(SAVE_SLD_TEMPLATE, undefined);
    }

    private resetSldTemplate() {
        this.toggleSldEditorState();
        this.setState(RESET_SLD_TEMPLATE, undefined);
    }

    private settingsApply() {
        this.setState(CLICK_LAYER_STYLES_SETTINGS_OK, undefined);
    }

    private settingsCancel() {
        this.setState(CLICK_LAYER_STYLES_SETTINGS_CANCEL, undefined);
    }
    private deleteLegendObject(selectedLegendObject: GwtkMapLegendItem) {
        this.setState(TOGGLE_MAP_LEGEND_ITEM_ADDITIONAL_STYLE, selectedLegendObject);
    }

    returnToPreviousView() {
        this.setState(CLICK_LAYER_STYLES_SETTINGS_RETURN, undefined);
    }

    openMapLegend() {
        this.setState(CALL_MAP_LEGEND_COMPONENT, this.layerNodeId);
    }
}