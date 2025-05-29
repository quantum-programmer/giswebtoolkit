/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Виджет компонента "Картограммы"                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import {
    GwtkUserThematicTaskState,
    CHANGE_HAS_TITLE_LINE,
    BUILD_THEMATIC_MAP,
    EDIT_BUILD_PARAMETER,
    OPEN_DATA_FILE,
    REMOVE_BUILD_PARAMETER,
    SELECT_BUILD_PARAMETER,
    SELECT_OBJECT_ACTION,
    SET_SEMANTIC_DATA_LINK_COLUMN,
    SET_DELIMITER_VALUE,
    SET_LAYER_CURRENT,
    SET_SERVICE_CURRENT,
    SET_VIRTUAL_FOLDER,
    TOGGLE_SOURCE,
    CLOSE_CSV_FILE,
    SHOW_DIAGRAM,
    ADD_SELECTED_OBJECTS_TO_PARAMETER_LIST,
    REMOVE_ADDED_SELECTED_OBJECTS,
    CHANGE_ACTION_INDICATOR,
} from './GwtkUserThematicTask';
import { Cell } from '~/services/Utils/CsvEditor';
import { Chart, registerables } from 'chart.js';
import {
    BuildParameterOptions,
    ThematicChartDataArray
} from '~/types/Types';
import {
    CartogramSource,
    Delimiter,
    LayerItem,
    Semantic,
} from '../Types';
import GwtkBuildParameterEditor
    from '@/components/GwtkUserThematic/task/components/GwtkBuildParameterEditor/GwtkBuildParameterEditor.vue';
import GwtkChartThematic from '@/components/GwtkUserThematic/task/components/GwtkChartThematic/GwtkChartThematic.vue';
import GwtkUserThematicProjectManager
    from '@/components/GwtkUserThematic/task/components/GwtkUserThematicProjectManager/GwtkUserThematicProjectManager.vue';

Chart.register( ...registerables );

/**
 * Компонент "Картограмма"
 * @class GwtkUserThematicWidget
 * @extends BaseGwtkVueComponent
 */
@Component( { components: { GwtkBuildParameterEditor, GwtkChartThematic, GwtkUserThematicProjectManager } } )
export default class GwtkUserThematicWidget extends BaseGwtkVueComponent { // TODO если карта в виджете не нужна, то наследоваться от Vue
    @Prop( { default: '' } )
    readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    readonly setState!: <K extends keyof GwtkUserThematicTaskState>( key: K, value?: GwtkUserThematicTaskState[K] ) => void;

    @Prop( { default: '' } )
    readonly fileName!: string;

    @Prop( { default: () => [] } )
    readonly delimiters!: Delimiter[];

    @Prop( { default: () => [] } )
    readonly semanticValueCol!: Semantic[];

    @Prop( { default: 0 } )
    readonly numberConnectedField!: number;

    @Prop( { default: 0 } )
    readonly minValue!: number;

    @Prop( { default: 0 } )
    readonly maxValue!: number;

    @Prop( { default: () => [] } )
    readonly serviceUrlList!: string[];

    @Prop( { default: '' } )
    readonly activeServiceUrl!: string;

    @Prop( { default: () => [] } )
    readonly layerList!: LayerItem[];

    @Prop( { default: true } )
    readonly isReadyCreateThematic!: boolean;

    @Prop( { default: true } )
    readonly isReadyGetFeature!: boolean;

    @Prop( { default: 0 } )
    readonly rangeIndex!: number;

    @Prop( { default: 0 } )
    readonly cartogramSource!: CartogramSource;

    @Prop( { default: '' } )
    readonly activeLayerId!: string;

    @Prop( { default: 0 } )
    readonly currentDelimiterId!: number;

    @Prop( { default: () => [] } )
    readonly buildParameterList!: { id: string, text: string }[];

    @Prop( { default: () => ({}) } )
    readonly buildParametersOptionsTemp!: BuildParameterOptions & { rangesCount: number };

    @Prop( { default: false } )
    readonly isParameterSettingMode!: boolean;

    @Prop( { default: () => ({}) } )
    readonly thematicChartDataArray!: ThematicChartDataArray;

    @Prop( { default: () => [] } )
    readonly virtualFolderList!: { alias: string; folder: string; }[];

    @Prop( { default: false } )
    readonly hasTitleLine!: boolean;

    @Prop( { default: 0 } )
    readonly currentVirtualFolderIndex!: number;

    @Prop( { default: false } )
    readonly bySelectedObjects!: boolean;

    @Prop( { default: false } )
    readonly selectActionStatus!: boolean;

    @Prop( { default: false } )
    readonly isSelectedObjectsAdded!: boolean;

    @Prop( { default: 0 } )
    readonly selectedObjectsLength!: number;

    @Prop( { default: '' } )
    readonly needToOpenCsvName!: string;

    @Prop( { default: () => [] } )
    readonly projectNamesList!: string[];

    @Prop( { default: 0 } )
    readonly projectSelectedIndex!: number;

    @Prop( { default: false } )
    readonly showDiagram!: boolean;

    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    @Prop({ default: () => [] })
    readonly colorLegend!: string[];

    activeTabWidget: number = 0;

    private cartogramName = this.$t( 'userthematic.Cartogram' ) + '';

    private themeName = this.$t( 'userthematic.Theme' ) + ' 1';

    get currentSource(): 0 | 1 {
        return this.cartogramSource;
    }

    set currentSource( value: 0 | 1 ) {
        this.setState( TOGGLE_SOURCE, value );
    }

    get userCartogramName() {
        let value = this.cartogramName;
        let index = 1;
        while ( this.builtCartogramNames.includes( value ) ) {
            value = `${this.cartogramName} (${index++})`;
        }
        return value;
    }

    private readonly builtCartogramNames: string[] = [];

    get isDiagramTabEnabled() {
        return (this.isParameterSettingMode && this.buildParametersOptionsTemp.userThematicRangeList.length)
            || (this.buildParameterList.length);
    }

    get delimitersNames() {
        const names: { id: number; name: string }[] = [];

        this.delimiters.forEach( item => {
            const cols = item.cols ? ' (' + item.cols + ')' : '';
            names.push( { id: item.id, name: item.name + cols } );
        } );

        return names;
    }

    get delimitersColsSum() {
        let sum = 0;

        this.delimiters.forEach( item => {
            sum += item.cols;
        } );

        return sum ? ' (' + this.$t( 'userthematic.Number of columns' ).toString().toLowerCase() + ')' : '';
    }

    changeDelimiter( value: number ) {
        this.setState( SET_DELIMITER_VALUE, value );
    }

    changeVirtualFolder( value: string ) {
        this.setState( SET_VIRTUAL_FOLDER, value );
    }

    openFile() {
        this.setState( OPEN_DATA_FILE, this.hasTitleLine );
    }

    changeServiceUrl( serviceUrl: string ) {
        this.setState( SET_SERVICE_CURRENT, serviceUrl );
    }

    changeLayer( layerXid: string ) {
        this.setState( SET_LAYER_CURRENT, layerXid );
    }

    changeSemanticDataLinkColumn( value: number ) {
        this.setState( SET_SEMANTIC_DATA_LINK_COLUMN, value );
    }

    buildMap() {

        const selectedVirtualFolder = this.virtualFolderList[ this.currentVirtualFolderIndex ].folder;

        const params = {
            alias: this.userCartogramName,
            path: selectedVirtualFolder ? `${selectedVirtualFolder}/${this.themeName}/${this.cartogramName}` : '',
        };

        this.setState( BUILD_THEMATIC_MAP, params );

        this.builtCartogramNames.push( this.userCartogramName );
    }

    get disabledBuildMap() {
        return !this.buildParameterList.length;
    }

    toggleSource( value: CartogramSource ) {
        this.setState( TOGGLE_SOURCE, value );
    }

    get currentLayer() {
        return this.layerList.find( layerItem => layerItem.id === this.activeLayerId );
    }

    get semLinkName() {
        return this.currentLayer && this.currentLayer.semlinkname;
    }

    get objectSemanticListForParameters() {
        let objectSemanticList: Cell[] = [];
        const layerItem = this.currentLayer;
        if ( layerItem ) {

            layerItem.objectSemanticList.forEach( ( objecySemantic ) => {

                if ( objecySemantic.type === 'Number' ) {
                    objectSemanticList.push( objecySemantic );
                }
            } );
        }

        return objectSemanticList;
    }

    selectBuildParameter( name: string ) {
        this.setState( SELECT_BUILD_PARAMETER, name );
    }

    editBuildParameter( value: string, index: number, id: string ) {
        this.setState( EDIT_BUILD_PARAMETER, { value, index, id } );
    }

    removeBuildParameter( index: number ) {
        this.setState( REMOVE_BUILD_PARAMETER, index );
    }

    get parameterList() {
        const parameterList: Semantic[] = [];
        this.semanticValueCol.forEach( ( semantic ) => {

            if ( semantic.type === 'Number' &&
                this.buildParameterList.findIndex( ( item ) => item.id === semantic.name ) === -1 ) {
                parameterList.push( semantic );
            }
        } );

        return parameterList;
    }

    changeHasTitleLine( value: boolean ) {
        this.setState( CHANGE_HAS_TITLE_LINE, value );
    }

    changeBySelectedObjects( value: boolean ) {
        this.setState( SELECT_OBJECT_ACTION, value );
    }

    closeFile() {
        this.setState( CLOSE_CSV_FILE );
    }

    goBack() {
        this.activeTabWidget = 0;
    }

    showDiagramClick() {
        this.setState( SHOW_DIAGRAM, true );
    }

    cancelDiagramClick() {
        this.setState( SHOW_DIAGRAM, false );
    }

    addSelectedObjectsToParameterList() {
        this.setState( ADD_SELECTED_OBJECTS_TO_PARAMETER_LIST );
    }

    get actionIndicatorIcon() {
        return this.selectActionStatus ? 'mdi-selection' : 'mdi-selection-off';
    }

    toggleActionIndicator() {
        this.setState( CHANGE_ACTION_INDICATOR );
    }

    toggleCloseSelected() {
        this.setState( REMOVE_ADDED_SELECTED_OBJECTS );
    }
}
