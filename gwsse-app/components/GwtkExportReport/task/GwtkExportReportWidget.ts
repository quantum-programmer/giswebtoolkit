/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                        "Экспорт отчётов"                         *
 *                                                                  *
 *******************************************************************/

import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {Component, Prop} from 'vue-property-decorator';
import {
    EXPORT_REPORT_ADD_HEADER,
    EXPORT_REPORT_REMOVE_HEADER,
    EXPORT_REPORT_SET_COORDINATE_GRID_STEP_DEGREES,
    EXPORT_REPORT_SET_COORDINATE_GRID_STEP_METERS,
    EXPORT_REPORT_SET_COORDINATE_GRID_SYSTEM_TYPE,
    EXPORT_REPORT_SET_DATE_FORMAT,
    EXPORT_REPORT_SET_DPI,
    EXPORT_REPORT_SET_FILE_FORMAT,
    EXPORT_REPORT_SET_FONT_FAMILY,
    EXPORT_REPORT_SET_FONT_SIZE,
    EXPORT_REPORT_SET_HEADER_FONT_FAMILY,
    EXPORT_REPORT_SET_HEADER_FONT_SIZE,
    EXPORT_REPORT_SET_HEADER_TEXT,
    EXPORT_REPORT_SET_LAYERS_SELECTED,
    EXPORT_REPORT_SET_LEGEND_ABOVE_MAP,
    EXPORT_REPORT_SET_LEGEND_FONT_FAMILY,
    EXPORT_REPORT_SET_LEGEND_FONT_SIZE,
    EXPORT_REPORT_SET_LEGEND_ICON_SIZE,
    EXPORT_REPORT_SET_LEGEND_POSITION_BOTTOM,
    EXPORT_REPORT_SET_LEGEND_POSITION_RIGHT,
    EXPORT_REPORT_SET_LOGOTYPE,
    EXPORT_REPORT_SET_LOGOTYPE_POSITION_LEFT,
    EXPORT_REPORT_SET_LOGOTYPE_POSITION_TOP,
    EXPORT_REPORT_SET_PAGE_FORMAT,
    EXPORT_REPORT_SET_PAGE_MARGIN,
    EXPORT_REPORT_SET_PAGE_NUMERATION_BOTTOM,
    EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_FAMILY,
    EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_SIZE,
    EXPORT_REPORT_SET_PAGE_ORIENTATION,
    EXPORT_REPORT_SET_SHOW_ATTRIBUTES,
    EXPORT_REPORT_TOGGLE_AND_UPDATE_ATTRIBUTES,
    EXPORT_REPORT_SET_SHOW_COORDINATE_GRID,
    EXPORT_REPORT_SET_SHOW_COORDINATE_SYSTEM,
    EXPORT_REPORT_SET_SHOW_DATE,
    EXPORT_REPORT_SET_SHOW_FEATURES,
    EXPORT_REPORT_SET_SHOW_HEADERS,
    EXPORT_REPORT_SET_SHOW_LEGEND,
    EXPORT_REPORT_SET_SHOW_LOGOTYPE,
    EXPORT_REPORT_SET_SHOW_NORTH_ARROW,
    EXPORT_REPORT_SET_SHOW_PAGE_NUMERATION,
    EXPORT_REPORT_SET_SHOW_SCALE,
    EXPORT_REPORT_SET_SHOW_SCALE_BAR,
    EXPORT_REPORT_SET_SHOW_STAMP,
    EXPORT_REPORT_SET_STAMP_FONT_FAMILY,
    EXPORT_REPORT_SET_STAMP_FONT_SIZE,
    EXPORT_REPORT_SET_STAMP_ORGANIZATION_ADDRESS,
    EXPORT_REPORT_SET_STAMP_ORGANIZATION_NAME,
    EXPORT_REPORT_SET_STAMP_TYPE,
    EXPORT_REPORT_SUBMIT_FORM,
    EXPORT_REPORT_TOGGLE_LAYERS_SELECTED_FROM_TEMPLATE,
    EXPORT_REPORT_SET_ATTRIBUTES_FONT_FAMILY,
    EXPORT_REPORT_SET_ATTRIBUTES_FONT_SIZE,
    EXPORT_REPORT_SET_FEATURES_FONT_FAMILY,
    EXPORT_REPORT_SET_FEATURES_FONT_SIZE
} from './GwtkExportReportTask';
import GwtkTaskContainerItem from '@/components/System/AppContainers/GwtkTaskContainerItem/GwtkTaskContainerItem.vue';
import {TaskDescription} from '~/taskmanager/TaskManager';
import {ExportReportProgressStage, ExportReportVersion, ExportReportWidgetParams} from './Types';
import GwtkOptionsBlock from './components/GwtkOptionsBlock/GwtkOptionsBlock.vue';
import GwtkLayersList from './components/GwtkLayersList/GwtkLayersList.vue';
import Layer from '~/maplayers/Layer';
import GwtkHeaderItem from './components/GwtkHeaderItem/GwtkHeaderItem.vue';
import GwtkSelectLogotype from './components/GwtkSelectLogotype/GwtkSelectLogotype.vue';
import GwtkChevronSwitcher from './components/GwtkChevronSwitcher/GwtkChevronSwitcher.vue';
import Vue from 'vue';
import {ExportReportCoordinateSystemType} from '../../../service/GISWebServerSEService/Types';
import ConstructorTemplates from './components/ConstructorTemplates/ConstructorTemplates.vue';
import {PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG} from '~/utils/WorkspaceManager';

interface VuetifyForm extends Vue {
    validate(): boolean;
}

@Component({
    components: {
        ConstructorTemplates,
        GwtkTaskContainerItem,
        GwtkChevronSwitcher,
        GwtkOptionsBlock,
        GwtkLayersList,
        GwtkHeaderItem,
        GwtkSelectLogotype
    }
})
export default class GwtkExportReportWidget extends BaseGwtkVueComponent {

    @Prop({default: ''})
    private readonly taskId!: string;

    @Prop({default: () => ({})})
    private readonly description!: TaskDescription;

    @Prop({default: () => ({})})
    private readonly setState!: ExportReportWidgetParams['setState'];

    @Prop({default: () => ([])})
    private readonly layerIds!: ExportReportWidgetParams['layerIds'];

    @Prop({default: () => ([])})
    private readonly layersSelected!: ExportReportWidgetParams['layersSelected'];

    @Prop({default: false})
    private readonly isLegendAvailable!: ExportReportWidgetParams['isLegendAvailable'];

    @Prop({default: () => ([])})
    private readonly setLayersSelected!: ExportReportWidgetParams['setLayersSelected'];

    @Prop({default: false})
    private readonly useLayersFromTemplate!: ExportReportWidgetParams['useLayersFromTemplate'];

    @Prop({default: () => ([])})
    private readonly layersSelectedFromTemplate!: ExportReportWidgetParams['layersSelectedFromTemplate'];

    @Prop({default: () => ([])})
    private readonly formats!: ExportReportWidgetParams['formats'];

    @Prop({default: () => ([])})
    private readonly pageFormats!: ExportReportWidgetParams['pageFormats'];

    @Prop({default: () => ([])})
    private readonly pageOrientations!: ExportReportWidgetParams['pageOrientations'];

    @Prop({default: () => ([])})
    private readonly fonts!: ExportReportWidgetParams['fonts'];

    @Prop({default: () => ([])})
    private readonly dpi!: ExportReportWidgetParams['dpi'];

    @Prop({default: () => ([])})
    private readonly logotypes!: ExportReportWidgetParams['logotypes'];

    @Prop({default: false})
    private readonly featuresSelected!: ExportReportWidgetParams['featuresSelected'];

    @Prop({default: null})
    private readonly attributes!: ExportReportWidgetParams['attributes'];

    @Prop({default: null})
    private readonly attributesFetchParameters!: ExportReportWidgetParams['attributesFetchParameters'];

    @Prop({default: false})
    private readonly useAttributesFetchParameters!: boolean;

    @Prop({default: false})
    private readonly isAttributesFetching!: boolean;

    @Prop({default: () => ([])})
    private readonly iconSizes!: ExportReportWidgetParams['iconSizes'];

    @Prop({default: () => ([])})
    private readonly coordinateGridStepsMeters!: ExportReportWidgetParams['coordinateGridStepsMeters'];

    @Prop({default: () => ([])})
    private readonly coordinateGridStepsDegrees!: ExportReportWidgetParams['coordinateGridStepsDegrees'];

    @Prop({default: () => ([])})
    private readonly dateFormats!: ExportReportWidgetParams['dateFormats'];

    @Prop({default: () => ([])})
    private readonly stamps!: ExportReportWidgetParams['stamps'];

    @Prop({default: () => ({})})
    private readonly constructorOptions!: ExportReportWidgetParams['constructorOptions'];

    @Prop({default: false})
    private readonly exporting!: ExportReportWidgetParams['exporting'];

    @Prop({default: () => ({})})
    private readonly progress!: ExportReportWidgetParams['progress'];

    @Prop({default: () => ([])})
    private readonly constructorTemplatesPublic!: ExportReportWidgetParams['constructorTemplatesPublic'];

    @Prop({default: () => ([])})
    private readonly constructorTemplatesLocal!: ExportReportWidgetParams['constructorTemplatesLocal'];

    @Prop({default: false})
    private readonly isLogged!: boolean;

    @Prop({default: false})
    private readonly isAdmin!: boolean;

    @Prop({default: ''})
    private readonly userName!: string;

    private readonly exportReportCoordinateGridSystemTypes = [
        {code: ExportReportCoordinateSystemType.Meters, text: this.$t('exportReport.Rectangular in meters')},
        {code: ExportReportCoordinateSystemType.Degrees, text: this.$t('exportReport.Degrees, minutes, seconds')}
    ];

    private activeTab: string = 'settingsTab';

    public $refs!: {
        constructorForm: VuetifyForm;
    };

    get isVersionNative(): boolean {
        return this.constructorOptions.reportVersion === ExportReportVersion.Native;
    }

    get isVersionTransneft(): boolean {
        return this.constructorOptions.reportVersion === ExportReportVersion.Transneft;
    }

    get attributesError(): string {
        if (this.attributes && this.attributes.count && this.attributes.count > this.constructorOptions.attributesOptions.limit) {
            let message = this.$t('exportReport.Only $1 lines out of $2 will be displayed') as string;
            message = message.replace('$1', this.constructorOptions.attributesOptions.limit.toString());
            message = message.replace('$2', this.attributes.count.toString());
            return message;
        }
        return '';
    }

    fontSizeRules(min: number, max: number): ((v: string) => boolean | string)[] {
        return [
            v => v !== '' || this.$t('exportReport.Number value required') as string,
            v => parseInt(v) >= min || this.$t('exportReport.Number must be greater than or equal') as string + ' ' + min,
            v => parseInt(v) <= max || this.$t('exportReport.Number must be less than or equal') as string + ' ' + max
        ];
    }

    get pageMarginRules(): ((v: string) => boolean | string)[] {
        if (!this.isPdf) {
            return [];
        }
        return [
            v => v !== '' || this.$t('exportReport.Number value required') as string,
            v => parseInt(v) >= 0 || this.$t('exportReport.Number must be greater than or equal zero') as string,
            v => parseInt(v) <= this.constructorOptions.pageOptions.maxMargin || this.$t('exportReport.Number must be less than or equal') as string + ' ' + this.constructorOptions.pageOptions.maxMargin
        ];
    }

    get showLogotypeRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showLogotype || this.constructorOptions.logotypeOptions.logotype >= 0) {
            return [];
        }
        if (this.logotypes.length === 0) {
            return [
                v => !v || this.$t('exportReport.Logotypes are not specified') as string
            ];
        }
        return [
            v => !v || this.$t('exportReport.Select logotype') as string
        ];
    }

    get logotypePositionRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showLogotype) {
            return [];
        }
        return [
            v => v !== '' || this.$t('exportReport.Number value required') as string,
            v => parseInt(v) >= 0 || this.$t('exportReport.Number must be greater than or equal zero') as string,
            v => parseInt(v) <= this.constructorOptions.logotypeOptions.maxPosition || this.$t('exportReport.Number must be less than or equal') as string + ' ' + this.constructorOptions.logotypeOptions.maxPosition
        ];
    }

    get legendFontSizeRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showLegend) {
            return [];
        }
        return this.fontSizeRules(this.constructorOptions.legendOptions.minFontSize, this.constructorOptions.legendOptions.maxFontSize);
    }

    get legendPositionRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showLegend || (this.isPdf && !this.constructorOptions.legendOptions.aboveMap)) {
            return [];
        }
        return [
            v => v !== '' || this.$t('exportReport.Number value required') as string,
            v => parseInt(v) >= 0 || this.$t('exportReport.Number must be greater than or equal zero') as string,
            v => parseInt(v) <= this.constructorOptions.legendOptions.maxPosition || this.$t('exportReport.Number must be less than or equal') as string + ' ' + this.constructorOptions.legendOptions.maxPosition
        ];
    }

    get isPdf(): boolean {
        return this.constructorOptions.format === 'pdf';
    }

    get featuresFontSizeRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showFeatures) {
            return [];
        }
        return this.fontSizeRules(this.constructorOptions.featuresOptions.minFontSize, this.constructorOptions.featuresOptions.maxFontSize);
    }

    get attributesFontSizeRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showAttributes) {
            return [];
        }
        return this.fontSizeRules(this.constructorOptions.attributesOptions.minFontSize, this.constructorOptions.attributesOptions.maxFontSize);
    }

    get pageNumerationFontSizeRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showPageNumeration) {
            return [];
        }
        return this.fontSizeRules(this.constructorOptions.pageNumerationOptions.minFontSize, this.constructorOptions.pageNumerationOptions.maxFontSize);
    }

    get pageNumerationBottomRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showPageNumeration) {
            return [];
        }
        return [
            v => v !== '' || this.$t('exportReport.Number value required') as string,
            v => parseInt(v) >= 0 || this.$t('exportReport.Number must be greater than or equal zero') as string,
            v => parseInt(v) <= this.constructorOptions.pageNumerationOptions.maxBottom || this.$t('exportReport.Number must be less than or equal') as string + ' ' + this.constructorOptions.pageNumerationOptions.maxBottom
        ];
    }

    get stampFontSizeRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showStamp) {
            return [];
        }
        return this.fontSizeRules(this.constructorOptions.stampOptions.minFontSize, this.constructorOptions.stampOptions.maxFontSize);
    }

    get stampTextRules(): ((v: string) => boolean | string)[] {
        if (!this.constructorOptions.showStamp) {
            return [];
        }
        return [
            v => v !== '' || this.$t('exportReport.Value is required') as string,
            v => v.length <= this.constructorOptions.stampOptions.maxLength || this.$t('exportReport.Max text length is') as string + ' ' + this.constructorOptions.stampOptions.maxLength
        ];
    }

    get prepareProgress(): number {
        return this.progress[ExportReportProgressStage.Prepare];
    }

    get legendProgress(): number {
        return this.progress[ExportReportProgressStage.Legend];
    }

    get currentProgress(): number {
        if (this.constructorOptions.showLegend) {
            return (this.prepareProgress + this.legendProgress) / 2;
        }
        return this.prepareProgress;
    }

    get isMetersCoordinateSystemType(): boolean {
        return this.constructorOptions.coordinateGridOptions.systemType === ExportReportCoordinateSystemType.Meters;
    }

    get isDegreesCoordinateSystemType(): boolean {
        return this.constructorOptions.coordinateGridOptions.systemType === ExportReportCoordinateSystemType.Degrees;
    }

    get isReducedInterface(): boolean {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    protected formIsValid: boolean = false;

    protected validateForm(): boolean {
        return this.$refs.constructorForm.validate();
    }

    protected toggleUseLayersFromTemplate(): void {
        this.setState(EXPORT_REPORT_TOGGLE_LAYERS_SELECTED_FROM_TEMPLATE, undefined);
    }

    protected updateLayers(layers: Layer[]): void {
        this.setState(EXPORT_REPORT_SET_LAYERS_SELECTED, layers);
    }

    protected setFormat(value: string): void {
        this.setState(EXPORT_REPORT_SET_FILE_FORMAT, value);
        this.$nextTick(() => {
            this.validateForm();
        });
    }

    protected setDpi(value: string): void {
        this.setState(EXPORT_REPORT_SET_DPI, value);
    }

    protected setPageFormat(value: string): void {
        this.setState(EXPORT_REPORT_SET_PAGE_FORMAT, value);
    }

    protected setPageOrientation(value: string): void {
        this.setState(EXPORT_REPORT_SET_PAGE_ORIENTATION, value);
    }

    protected getPageMarginFieldLabel(marginIndex: number): string {
        const values = ['From top', 'From right', 'From bottom', 'From left'];
        return this.$t('exportReport.' + values[marginIndex]) as string;
    }

    protected setPageMargin(marginIndex: number, value: string) {
        this.setState(EXPORT_REPORT_SET_PAGE_MARGIN, {
            index: marginIndex,
            margin: parseInt(value)
        });
    }

    protected setFontFamily(value: string): void {
        this.setState(EXPORT_REPORT_SET_FONT_FAMILY, value);
    }

    protected setFontSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_FONT_SIZE, parseInt(value));
    }

    protected setShowLogotype(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_LOGOTYPE, value);
        this.validateForm();
    }

    protected setLogotype(value: number): void {
        this.setState(EXPORT_REPORT_SET_LOGOTYPE, value);
    }

    protected setLogotypePositionTop(value: string): void {
        this.setState(EXPORT_REPORT_SET_LOGOTYPE_POSITION_TOP, parseInt(value));
    }

    protected setLogotypePositionLeft(value: string): void {
        this.setState(EXPORT_REPORT_SET_LOGOTYPE_POSITION_LEFT, parseInt(value));
    }

    protected setShowHeaders(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_HEADERS, value);
        this.validateForm();
    }

    protected setHeaderText(headerIndex: number, value: string): void {
        this.setState(EXPORT_REPORT_SET_HEADER_TEXT, {
            index: headerIndex,
            text: value
        });
    }

    protected setHeaderFontFamily(headerIndex: number, value: string): void {
        this.setState(EXPORT_REPORT_SET_HEADER_FONT_FAMILY, {
            index: headerIndex,
            fontFamily: value
        });
    }

    protected setHeaderFontSize(headerIndex: number, value: string): void {
        this.setState(EXPORT_REPORT_SET_HEADER_FONT_SIZE, {
            index: headerIndex,
            fontSize: parseInt(value)
        });
    }

    protected addHeader(): void {
        this.setState(EXPORT_REPORT_ADD_HEADER, undefined);
    }

    protected removeHeader(): void {
        this.setState(EXPORT_REPORT_REMOVE_HEADER, undefined);
    }

    protected setShowLegend(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_LEGEND, value);
        this.validateForm();
    }

    protected setLegendIconSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_LEGEND_ICON_SIZE, parseInt(value));
    }

    protected setLegendFontSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_LEGEND_FONT_SIZE, parseInt(value));
    }

    protected setLegendFontFamily(value: string): void {
        this.setState(EXPORT_REPORT_SET_LEGEND_FONT_FAMILY, value);
    }

    protected setLegendPositionRight(value: string): void {
        this.setState(EXPORT_REPORT_SET_LEGEND_POSITION_RIGHT, parseInt(value));
    }

    protected setLegendPositionBottom(value: string): void {
        this.setState(EXPORT_REPORT_SET_LEGEND_POSITION_BOTTOM, parseInt(value));
    }

    protected setLegendAboveMap(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_LEGEND_ABOVE_MAP, value);
    }

    protected setShowNorthArrow(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_NORTH_ARROW, value);
    }

    protected setShowScale(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_SCALE, value);
    }

    protected setShowScaleBar(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_SCALE_BAR, value);
    }

    protected setShowCoordinateSystem(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_COORDINATE_SYSTEM, value);
    }

    protected setShowCoordinateGrid(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_COORDINATE_GRID, value);
    }

    protected setCoordinateGridSystemType(value: number): void {
        this.setState(EXPORT_REPORT_SET_COORDINATE_GRID_SYSTEM_TYPE, value);
    }

    protected setCoordinateGridStepMeters(value: number): void {
        this.setState(EXPORT_REPORT_SET_COORDINATE_GRID_STEP_METERS, value);
    }

    protected setCoordinateGridStepDegrees(value: number): void {
        this.setState(EXPORT_REPORT_SET_COORDINATE_GRID_STEP_DEGREES, value);
    }

    protected setShowFeatures(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_FEATURES, value);
    }

    protected setFeaturesFontFamily(value: string): void {
        this.setState(EXPORT_REPORT_SET_FEATURES_FONT_FAMILY, value);
    }

    protected setFeaturesFontSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_FEATURES_FONT_SIZE, parseInt(value));
    }

    protected setShowAttributes(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_ATTRIBUTES, value);
    }

    protected toggleAndUpdateAttributes(value: boolean): void {
        this.setState(EXPORT_REPORT_TOGGLE_AND_UPDATE_ATTRIBUTES, value);
    }

    protected setAttributesFontFamily(value: string): void {
        this.setState(EXPORT_REPORT_SET_ATTRIBUTES_FONT_FAMILY, value);
    }

    protected setAttributesFontSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_ATTRIBUTES_FONT_SIZE, parseInt(value));
    }

    protected setShowPageNumeration(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_PAGE_NUMERATION, value);
        this.validateForm();
    }

    protected setPageNumerationFontFamily(value: string): void {
        this.setState(EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_FAMILY, value);
    }

    protected setPageNumerationFontSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_PAGE_NUMERATION_FONT_SIZE, parseInt(value));
    }

    protected setPageNumerationBottom(value: string): void {
        this.setState(EXPORT_REPORT_SET_PAGE_NUMERATION_BOTTOM, parseInt(value));
    }

    protected setShowDate(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_DATE, value);
        this.validateForm();
    }

    protected setDateFormat(value: string): void {
        this.setState(EXPORT_REPORT_SET_DATE_FORMAT, value);
    }

    protected setShowStamp(value: boolean): void {
        this.setState(EXPORT_REPORT_SET_SHOW_STAMP, value);
        this.validateForm();
    }

    protected setStampType(value: string): void {
        this.setState(EXPORT_REPORT_SET_STAMP_TYPE, value);
    }

    protected setStampFontFamily(value: string): void {
        this.setState(EXPORT_REPORT_SET_STAMP_FONT_FAMILY, value);
    }

    protected setStampFontSize(value: string): void {
        this.setState(EXPORT_REPORT_SET_STAMP_FONT_SIZE, parseInt(value));
    }

    protected setStampOrganizationName(value: string): void {
        this.setState(EXPORT_REPORT_SET_STAMP_ORGANIZATION_NAME, value);
    }

    protected setStampOrganizationAddress(value: string): void {
        this.setState(EXPORT_REPORT_SET_STAMP_ORGANIZATION_ADDRESS, value);
    }

    protected submitForm(): void {
        if (!this.validateForm()) {
            return;
        }
        this.setState(EXPORT_REPORT_SUBMIT_FORM, undefined);
    }

    protected switchToSettingsTab(): void {
        this.activeTab = 'settingsTab';
    }

}
