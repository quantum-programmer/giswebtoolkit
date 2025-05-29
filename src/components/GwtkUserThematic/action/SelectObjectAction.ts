import GwtkUserThematicTask from '@/components/GwtkUserThematic/task/GwtkUserThematicTask';
import HighlightObjectAction from '~/systemActions/HighlightObjectAction';
import SearchManager, { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import { SearchCriterionName } from '~/services/Search/criteria/BaseSearchCriterion';
import { METRIC } from '~/services/RequestServices/common/enumerables';
import MapObject from '~/mapobject/MapObject';
import { KeyListSearchCriterion } from '~/services/Search/criteria/StringArraySearchCriterion';

export default class SelectObjectAction extends HighlightObjectAction<GwtkUserThematicTask> {

    setup() {
        const selectedObjects = this.map.getSelectedObjects().slice();

        super.setup();

        if ( selectedObjects ) {
            this.map.addSelectedObjects( selectedObjects );
        }
    }

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {

        this.parentTask.setIsPanelReady( false );

        const vectorLayer = this.parentTask.vectorLayerItem?.vectorLayer;
        if ( !vectorLayer ) {
            return;
        }

        if ( !this.searchManager ) {
            this.searchManager = new SearchManager( this.map );
            this.searchManager.activateSource( SourceType.GISWebServiceSE, GISWebServiceSEMode.All, [vectorLayer] );
        }

        this.searchManager.clearSearchCriteriaAggregator();

        const criteriaAggregator = this.searchManager.getSearchCriteriaAggregatorCopy();
        criteriaAggregator.getObjectLocalSearchCriterion().clearValue();
        criteriaAggregator.getObjectLocalSearchCriterion().addValue( '0', '1', '2', '4' );
        criteriaAggregator.getBboxSearchCriterion().clearValue();

        criteriaAggregator.getBboxSearchCriterion().setValue( this.map.getWindowBounds() );

        criteriaAggregator.removeCriterion( SearchCriterionName.Count );
        criteriaAggregator.removeCriterion( SearchCriterionName.StartIndex );
        if ( this.parentTask.layerItem?.keylist ) {
            const keyListSearchCriterion: KeyListSearchCriterion = criteriaAggregator.getKeyListSearchCriterion();
            keyListSearchCriterion.addValue( this.parentTask.layerItem.keylist );
            criteriaAggregator.setKeyListSearchCriterion( keyListSearchCriterion );
        } else {
            criteriaAggregator.removeCriterion( SearchCriterionName.KeyList );
        }

        criteriaAggregator.getMetricCriterion().setValue( METRIC.AddMetric );

        const srsNameSearchCriterion = criteriaAggregator.getSrsNameSearchCriterion();
        srsNameSearchCriterion.setValue( this.map.getCrsString() );

        const semanticCriterionList = await this.parentTask.getSemanticCriterionListInit();
        const semanticSearchCriterion = criteriaAggregator.getSemanticSearchCriterion();

        semanticCriterionList.forEach( ( item ) => semanticSearchCriterion.addSemanticCriterion( item ) );

        semanticSearchCriterion.setLogicalDisjunction( semanticCriterionList.length > 1 );

        this.searchManager.setSearchCriteriaAggregator( criteriaAggregator );

        const result = await this.searchManager.findNext();
        let mapObjectsResult: MapObject[] = [];
        if ( result && result.mapObjects ) {
            const rscSemanticList = await this.parentTask.getVectorLayerSemanticList();

            const mapObjectList = result.mapObjects.filter( mapObject => {
                const semantics = mapObject.getSemantics();
                if ( semantics.length ) {
                    const semanticResult = semantics.find( semantic => {
                        if ( semantic.code ) {
                            const rscSemantic = rscSemanticList.find( item => item.code === semantic.code );
                            if ( rscSemantic ) {
                                return rscSemantic.type === '1' || rscSemantic.type === '16';
                            }
                        }
                    } );
                    return !!semanticResult;
                }
            } );

            mapObjectsResult = MapObject.sortMapObjectsByType( mapObjectList );
        }

        this.parentTask.showObjectsDownloadedCount( mapObjectsResult.length );
        this.parentTask.setIsPanelReady( true );
        return mapObjectsResult;
    }
}