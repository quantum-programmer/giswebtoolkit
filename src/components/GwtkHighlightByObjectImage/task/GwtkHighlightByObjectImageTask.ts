/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Компонент "Выделить по условному знаку объекта"      *
 *                                                                  *
 *******************************************************************/

import HighlightObjectImageAction from '@/components/GwtkHighlightByObjectImage/actions/HighlightObjectImageAction';
import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import MapObject from '~/mapobject/MapObject';
import {CURSOR_TYPE} from '~/types/Types';
import {GISWebServiceSEMode, SourceType} from '~/services/Search/SearchManager';
import {FeatureSemanticItem} from '~/utils/GeoJSON';
import {SemanticCriterion} from '~/services/Search/criteria/SemanticSearchCriterion';
import Layer from '~/maplayers/Layer';
import i18n from '@/plugins/i18n';
import {DataChangedEvent} from '~/taskmanager/TaskManager';
import {METRIC} from '~/services/RequestServices/common/enumerables';
import {LOCALE} from '~/types/CommonTypes';


const HIGHLIGHT_IMAGE_ACTION = 'gwtkhighlightbyobjectimage.highlightobjectimage';

/**
 * Выделение по условному знаку объекта
 * @class GwtkHighlightByObjectImageTask
 * @extends Task
 */
export default class GwtkHighlightByObjectImageTask extends Task {

    /**
     * Свойство активности запроса данных
     * @private
     * @property activeRequest {boolean}
     */
    private activeRequest = false;

    private mapLayer?: Layer = undefined;

    private cursor: CURSOR_TYPE;

    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
        this.actionRegistry.push( {
            getConstructor() {
                return HighlightObjectImageAction;
            },
            id: HIGHLIGHT_IMAGE_ACTION,
            active: false,
            enabled: true
        } );
        this.cursor = CURSOR_TYPE.default;
        //fixme: selectObjects
        this.map.closeLayer( 'dutymarking' );
    }

    setup() {
        if ( this.map.tiles.getSelectableLayersArray().length !== 0 ) {
            this.doAction( HIGHLIGHT_IMAGE_ACTION );
        } else {
            this.map.writeProtocolMessage(
                {
                    text: <string>i18n.t( 'manualobjecthighlight.No layers to highlight objects' ),
                    display: true
                }
            );
            this.mapWindow.getTaskManager().detachTask( this.id );
        }
    }

    get taskActive() {
        return this.activeRequest;
    }

    quit() {
        this.quitAction( HIGHLIGHT_IMAGE_ACTION );
        super.quit();
    }

    detachTask() {
        this.mapWindow.getTaskManager().detachTask( this.id );
    }

    /**
     * @method run
     */
    async run( mapObject: MapObject ) {

        this.activeRequest = true;

        const objectKey = mapObject.key;
        const layerId = mapObject.mapId;
        let local = await mapObject.getLocal();
        const semantics = this.getViewSemanticList( mapObject );

        if ( layerId && objectKey && local !==LOCALE.Undefined ) {
            const layer = this.map.tiles.getLayerByxId( mapObject.vectorLayer.xId );
            this.postRequest( layerId, objectKey, local.toString(), semantics, layer );
        } else {
            this.activeRequest = false;
        }
    }

    private postRequest( layerid: string, objectKey: string, local: string, semantics: FeatureSemanticItem[], layer: Layer | undefined ) {

        this.cursor = this.mapWindow.setCursor(CURSOR_TYPE.progress);

        const searchManager = this.map.searchManager;
        searchManager.stopSearch();
        searchManager.mapObjects.splice(0);

        searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.All);
        searchManager.clearSearchCriteriaAggregator();
        const aggregator = searchManager.getSearchCriteriaAggregatorCopy();

        aggregator.getLayerIdSearchCriterion().setValue(layerid);

        const objectLocalSearchCriterion = aggregator.getObjectLocalSearchCriterion();
        objectLocalSearchCriterion.clearValue();
        objectLocalSearchCriterion.addValue(local);

        const keyListSearchCriterion = aggregator.getKeyListSearchCriterion();
        keyListSearchCriterion.clearValue();
        keyListSearchCriterion.addValue(objectKey);

        aggregator.getCountSearchCriterion().setValue(0);
        aggregator.getGetGraphObjectsCriterion().setValue('0');
        aggregator.getMetricCriterion().setValue(METRIC.RemoveMetric);

        if (semantics.length > 0) {
            const semanticsCriterion = aggregator.getSemanticSearchCriterion();
            semantics.forEach((semantic) => {
                const textfilter: SemanticCriterion = { key: semantic.key, operator: 2, value: [semantic.value] };
                semanticsCriterion.addSemanticCriterion(textfilter);
            });
            semanticsCriterion.setLogicalDisjunction(false);
        }

        const srsNameSearchCriterion = aggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue( this.map.getCrsString() );

        this.mapWindow.getTaskManager().updateCriteriaAggregator( aggregator );
        searchManager.setSearchCriteriaAggregator( aggregator );

        this.mapWindow.showOverlay({ handleClose: () => this.abortRequest() });

        this.mapLayer = layer;

        let done = false;

        this.mapWindow.getTaskManager().hideObjectPanel();

        searchManager.findNext()
            .then(() => done = true)
            .finally( () => {
                this.mapWindow.setCursor( this.cursor );
                if ( done ) {
                    const objectCount = this.map.searchManager.mapObjects.length;
                    this.map.addSelectedObjects( searchManager.mapObjects );
                    setTimeout( () => {
                        this.mapWindow.removeOverlay();
                        const text = i18n.t( 'phrases.Objects selected' ) + ': ' + objectCount;
                        this.setMessage( text );
                    }, 200 );
                }
                this.activeRequest = false;
            } );
    }

    private getViewSemanticList( mapObject: MapObject ) {
        const result: FeatureSemanticItem[] = [];
        const semantics = mapObject.getSemantics();
        semantics.forEach( ( semantic ) => {
            if ( semantic.view === '1' ) {
                result.push( semantic );
            }
        } );
        return result;
    }

    private abortRequest() {
        this.map.searchManager.stopSearch();
    }

    onDataChanged(event: DataChangedEvent) {
        if (event.type === 'content' || (event.type === 'layercommand' && event.command === 'visibilitychanged')) {
            if (this.mapLayer) {
                if (!this.mapLayer.getVisibility()) {
                    this.mapLayer = undefined;
                    this.map.clearSelectedObjects();
                    this.map.clearServiceObjectsSelection();
                }
            }
        }

        if (this.map.tiles.getSelectableLayersArray().length === 0) {
            this.mapWindow.addSnackBarMessage(i18n.tc('manualobjecthighlight.No layers to highlight objects'));
        }
    }

    onSelectObjects() {
        this.mapWindow.getTaskManager().hideObjectPanel();
    }

}
