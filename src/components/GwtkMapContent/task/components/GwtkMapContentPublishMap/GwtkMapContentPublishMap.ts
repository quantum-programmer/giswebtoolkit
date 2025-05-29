import { Component, Prop } from 'vue-property-decorator';
import BaseMapContentView from '../BaseMapContentView';
import {
    ABORT_FILE_UPLOAD,
    CLICK_PUBLISH_MAP_BUTTON_CANCEL,
    CLICK_PUBLISH_MAP_BUTTON_OK,
    INPUT_LOAD_SETTINGS_XSD,
    PublishMapObject,
    RESET_SLD_TEMPLATE,
    SAVE_SLD_TEMPLATE,
    SELECT_VIRTUAL_FOLDER,
    SET_PUBLISH_MAP_CRS,
    SET_PUBLISH_MAP_NAME,
    SET_PUBLISH_MAP_SCALE,
    SldWidgetObject
} from '../../GwtkMapContentTask';
import GwtkMapContentPublishMapAddSldScheme from './GwtkMapContentPublishMapAddSldScheme/GwtkMapContentPublishMapAddSldScheme.vue';
import { MarkerIcon, MarkerImageCategory, MapMarkersCommandsFlags } from '~/types/Types';
import i18n from '@/plugins/i18n';
import VirtualFolder from '~/maplayers/VirtualFolder';

export const LAYERS_BY_GROUPS = 'tab_by_groups';


@Component( { components: { GwtkMapContentPublishMapAddSldScheme } } )
export default class GwtkMapContentPublishMap extends BaseMapContentView {

    @Prop( {  default: () => ({})  } )
    readonly publishMapObject!:PublishMapObject;
    
    @Prop( {  default: () => ({})  } )
    readonly sldObject!:SldWidgetObject;

    isOpenSldEditor: boolean = false;

    @Prop( { default: () => ([]) } )
    private readonly markerImageList!: MarkerIcon[];

    @Prop( { default: () => ([]) } )
    private readonly markerCategoryList!: MarkerImageCategory[];

    @Prop( { default: () => ({}) } )
    private readonly mapMarkersCommands!: MapMarkersCommandsFlags;

    private isVirtualFolderSelected: boolean = false;

    get isSldReady() {
        if (this.publishMapObject.xsdList.select === i18n.tc('mapcontent.By template')) {
            return this.sldObject.styleOptions.line.length > 0 && this.sldObject.styleOptions.polygon.length > 0;
        }
        return true;
    }

    private selectXsd(value: string) {
        this.setState(INPUT_LOAD_SETTINGS_XSD, value);
    }
    private changePublishMapName(value: string) {
        this.setState(SET_PUBLISH_MAP_NAME, value);
    }

    private changePublishMapScale(value: number) {
        this.setState(SET_PUBLISH_MAP_SCALE, value);
    }

    private changePublishMapCrs(value: string) {
        this.setState(SET_PUBLISH_MAP_CRS, value);
    }

    private selectVirtualFolder(value: VirtualFolder) {
        this.isVirtualFolderSelected = !!value.folder;
        this.setState(SELECT_VIRTUAL_FOLDER, value);
    }

    private settingsApply(value: undefined) {
        this.setState(CLICK_PUBLISH_MAP_BUTTON_OK, value);
    }

    private settingsReset(value: undefined) {
        this.setState(CLICK_PUBLISH_MAP_BUTTON_CANCEL, value);
    }

    private abortFileUpload(value: undefined) {
        this.setState(ABORT_FILE_UPLOAD, value);
    }

    private changeMode() {
        this.setState(CLICK_PUBLISH_MAP_BUTTON_CANCEL, undefined);
    }

    private openSldEditor(value: string) {
        this.isOpenSldEditor = true;
    }

    private closeSldEditor() {
        this.isOpenSldEditor = false;
    }

    private saveSldTemplate() {
        this.isOpenSldEditor = false;
        this.setState(SAVE_SLD_TEMPLATE, undefined);
    }

    private resetSldTemplate() {
        this.isOpenSldEditor = false;
        this.setState(RESET_SLD_TEMPLATE, undefined);

    }

    get crsItems() {
        return this.publishMapObject.crsList.list.map(item => ({
            ...item,
            title: `${item.name} (${item.epsg})`,
        }));
    }
}
