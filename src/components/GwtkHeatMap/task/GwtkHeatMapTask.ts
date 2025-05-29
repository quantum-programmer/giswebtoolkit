/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Компонент Построение тепловой карты                 *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkHeatMapWidget from '@/components/GwtkHeatMap/task/GwtkHeatMapWidget.vue';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import Utils from '~/services/Utils';
import { TreeNodeType, USER_LAYERS_FOLDER_ID } from '~/utils/MapTreeJSON';
import RequestService from '~/services/RequestServices/common/RequestService';
import { HeatMapOptions, GwtkLayerDescription } from '~/types/Options';
import Layer from '~/maplayers/Layer';
import { LogEventType } from '~/types/CommonTypes';
import GwtkError from '~/utils/GwtkError';


export const UPDATE_SELECTED_LAYER = 'gwtkheatmap.updateselectedlayer';
export const BUILD_HEAT_MAP = 'gwtkheatmap.buildheatmap';
export const CANCEL_REQUEST = 'gwtkheatmap.cancelrequest';
export type GwtkHeatMapkState = {
    [ UPDATE_SELECTED_LAYER ]: string;
    [ BUILD_HEAT_MAP ]: string;
    [ CANCEL_REQUEST ]: undefined;
}

type WidgetParams = {
    buildMapProgressBar: boolean;
    setState: GwtkHeatMapTask['setState'];
    mapLayersWithLegendDescriptions: HeatMapOptions[];
    selectedMapLayerId: string;
}

/**
 * Компонент "Построение тепловой карты"
 * @class GwtkHeatMapTask
 * @extends Task
 * @description
 */
export default class GwtkHeatMapTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private abortXhr?: () => void;

    /**
     * @constructor GwtkHeatMapTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );

        const mapLayersWithLegendDescriptions = this.map.options.hm_options || [];

        const selectedMapLayerId = mapLayersWithLegendDescriptions.length > 0 ? mapLayersWithLegendDescriptions[ 0 ].LayerName : '';

        mapLayersWithLegendDescriptions.forEach( param => {
            if ( param.LayerName ) {
                const maplayer = this.map.tiles.getLayerByxId( param.LayerName );
                if ( maplayer ) {
                    param.layerAlias = maplayer.alias;
                }
            }
        } );


        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            mapLayersWithLegendDescriptions,
            selectedMapLayerId,
            buildMapProgressBar: false
        };
    }


    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkHeatMapWidget';
        const sourceWidget = GwtkHeatMapWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

    setState<K extends keyof GwtkHeatMapkState>( key: K, value: GwtkHeatMapkState[K] ) {
        switch ( key ) {
            case UPDATE_SELECTED_LAYER:
                this.widgetProps.selectedMapLayerId = value as string;
                break;
            case BUILD_HEAT_MAP:
                const xid = this.widgetProps.selectedMapLayerId;
                let currentLayer = this.map.tiles.getLayerByxId( xid );

                if ( currentLayer ) {
                    this.buildHeatMap( currentLayer, value as string );
                }
                break;
            case CANCEL_REQUEST:
                if ( this.abortXhr ) {
                    this.abortXhr();
                    this.abortXhr = undefined;
                }
                break;
            default:
                if ( this._action ) {
                    this._action.setState( key, value );
                }
        }
    }

    private async buildHeatMap( currentLayer: Layer, heatMapName: string ) {
        const serviceUrl = currentLayer.serviceUrl;
        const httpParams = RequestServices.createHttpParams(this.map, { url: serviceUrl });
        const service = RequestServices.retrieveOrCreate( httpParams, ServiceType.REST );

        const idLayer = currentLayer.idLayer;

        const layerOptions = this.widgetProps.mapLayersWithLegendDescriptions.find( element => element.LayerName == currentLayer.id );
        if ( layerOptions ) {

            const ELEMSIZE = '' + layerOptions.elemsize;
            const PALETTE = '' + layerOptions.palette;
            const PALETTECOUNT = '' + layerOptions.palettecount;
            const RADIUS = '' + layerOptions.radius;
            const EXCODES = layerOptions.excodes.join( ',' );

            const options = {
                LAYER: idLayer,
                RADIUS,
                ELEMSIZE,
                EXCODES,
                ALIAS: heatMapName,
                PALETTE,
                PALETTECOUNT
            };

            try {

                this.widgetProps.buildMapProgressBar = true;

                const request = RequestService.sendCancellableRequest( service.buildHeatMap.bind( service ), options );

                this.abortXhr = () => request.abortXhr( 'Cancelled by User' );

                const response = await request.promise;

                if ( response.data && response.data.restmethod.createlayerlist.length > 0 ) {

                    const idHeatMapLayer = response.data.restmethod.createlayerlist[ 0 ].id;
                    const url = serviceUrl + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png' +
                        '&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS=' + encodeURIComponent( idHeatMapLayer );

                    const id = Utils.generateGUID();
                    const options:GwtkLayerDescription = {
                        alias: heatMapName,
                        id,
                        url,
                        export: ['mtq']
                    };

                    const layer = this.map.openLayer( options );

                    if ( layer ) {
                        this.map.onLayerListChanged( {
                            id,
                            text: heatMapName,
                            nodeType: TreeNodeType.HeatLayer,
                            parentId: USER_LAYERS_FOLDER_ID
                        } );

                    }

                } else {
                    this.map.writeProtocolMessage( { text: 'Empty BuildHeatMApResponse', type: LogEventType.Info } );
                }

                this.widgetProps.buildMapProgressBar = false;
            } catch ( error ) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage( { text: gwtkError.message, type: LogEventType.Error } );
                this.widgetProps.buildMapProgressBar = false;
            }
        }
    }
}

