/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент "Параметры карты"                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    ActiveServiceUrl,
    GwtkMapOptionsTaskState,
    CursorCoordinateSystemParam,
    UIParams,
    ProgramParameters,
    MapLegendParams
} from '@/components/GwtkMapOptions/task/GwtkMapOptionsTask';
import {
    MeasurementsStyle,
    MeasurementUnits,
    ObjectSelectionStyle,
    ObjectSearch
} from '~/utils/WorkspaceManager';
import GwtkMapOptionsParametersRefreshInterval
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersRefreshInterval/GwtkMapOptionsParametersRefreshInterval.vue';
import GwtkMapOptionsParametersCursorUnits
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersCursorUnits/GwtkMapOptionsParametersCursorUnits.vue';
import GwtkMapOptionsParametersUnits
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersUnits/GwtkMapOptionsParametersUnits.vue';
import GwtkMapOptionsParametersObjectSelection
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersObjectSelection/GwtkMapOptionsParametersObjectSelection.vue';
import GwtkMapOptionsParametersObjectSearch
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersObjectSearch/GwtkMapOptionsParametersObjectSearch.vue';
import GwtkMapOptionsParametersMeasurements
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersMeasurements/GwtkMapOptionsParametersMeasurements.vue';
import GwtkMapOptionsParametersTheme
    from '@/components/GwtkMapOptions/task/components/GwtkMapOptionsParameters/GwtkMapOptionsParametersTheme/GwtkMapOptionsParametersTheme.vue';
import { FINDDIRECTION, SORTTYPE } from '~/services/RequestServices/common/enumerables';
import GwtkMapOptionsLegend from './GwtkMapOptionsLegend/GwtkMapOptionsLegend.vue';
import GwtkMapOptionsInitialExtent from './GwtkMapOptionsInitialExtent/GwtkMapOptionsInitialExtent.vue';
import GwtkMapOptionsMapLog from './GwtkMapOptionsMapLog/GwtkMapOptionsMapLog.vue';


/**
 * Компонент "Настройка параметров"
 * @class GwtkMapOptionsParameters
 * @extends Vue
 */
@Component({ components: { 
    GwtkMapOptionsInitialExtent, 
    GwtkMapOptionsParametersRefreshInterval, 
    GwtkMapOptionsParametersCursorUnits, 
    GwtkMapOptionsParametersUnits, 
    GwtkMapOptionsParametersObjectSelection, 
    GwtkMapOptionsParametersObjectSearch, 
    GwtkMapOptionsParametersMeasurements, 
    GwtkMapOptionsParametersTheme, 
    GwtkMapOptionsLegend, 
    GwtkMapOptionsMapLog 
} } )
export default class GwtkMapOptionsParameters extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapOptionsTaskState>( key: K, value: GwtkMapOptionsTaskState[K] ) => void;

    @Prop( { default: () => ({}) } )
    private readonly parameters!: ProgramParameters;

    @Prop( { default: 0 } )
    private readonly refreshInterval!: number;

    @Prop( { default: () => ({}) } )
    private readonly units!: MeasurementUnits;

    @Prop( { default: () => ({}) } )
    private readonly objectSelection!: ObjectSelectionStyle;

    @Prop( { default: () => ({}) } )
    private readonly objectSearch!: ObjectSearch;

    @Prop( { default: () => ({}) } )
    private readonly measurements!: MeasurementsStyle;

    @Prop( { default: () => ({}) } )
    private readonly activeServicesUrls!: ActiveServiceUrl;

    @Prop( { default: () => ({}) } )
    private readonly cursorCoordinateParams!: CursorCoordinateSystemParam;

    @Prop( { default: () => ({}) } )
    private readonly ui!: UIParams;

    @Prop({ default: () => ({}) })
    initialExtent!: { resetMapContent: boolean };

    @Prop({ default: () => ({}) })
    mapLog!: { debugMode: boolean };

    @Prop({ default: () => ({}) })
    private readonly searchFilterSettings!: {
        type: string,
        semantic: string,
        direction: string
    };

    @Prop({ default: () => ({}) })
    private readonly sortTypes!: {
        type: {
            text: string,
            type: SORTTYPE
        }[],
        direction: {
            direction: FINDDIRECTION,
            text: string
        }[],
    };

    @Prop({ default: () => (false) })
    readonly mapLegend!: MapLegendParams;

}
