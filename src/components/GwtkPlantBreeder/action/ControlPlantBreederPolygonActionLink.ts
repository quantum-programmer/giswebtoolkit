/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *      Обработчик редактирования растениеводов в виде полигона     *
 *                                                                  *
 *******************************************************************/


import ActionLink from '~/taskmanager/ActionLink';
import GwtkPlantBreederTask, {
    DELETE_MODE_ACTION,
    EDIT_MODE_ACTION,
    GwtKPlantBreederTaskState,
    START_MODE_ACTION
} from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederTask';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import { LOCALE } from '~/types/CommonTypes';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { GISWebServiceSEMode } from '~/services/Search/SearchManager';


/**
 * Обработчик устоновки и редактирования растениеводов
 * @class ControlPlantBreederPolygonActionLink
 * @extends ActionLink<GwtkPlantBreederTask>
 */
export default class ControlPlantBreederPolygonActionLink extends ActionLink<GwtkPlantBreederTask> {

    /**
     * Редактируемый объект
     * @private
     * @property mapObject {MapObject}
     */
    private mapObject = new MapObject( this.parentTask.vectorLayer, MapObjectType.Polygon, { local: LOCALE.Plane});

    /**
     * Стили отображения объекта карты
     * @private
     * @readonly
     * @property mapObjectStyle {Style}
     */
    private readonly  mapObjectStyle = new Style({
        stroke: new Stroke( {
            color: 'grey',
            width: '2px',
            linejoin: 'round'
        } ),
        fill: new Fill( {
            color: 'grey',
            opacity: 0.5
        } )
    });

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = [
        START_MODE_ACTION, EDIT_MODE_ACTION, DELETE_MODE_ACTION
    ];

    destroy() {
        super.destroy();
        this.toggleGwtkMapObjectPanel(true);
        this.parentTask.removeLinkPanel();
        this.mapObject.removeAllPoints();
        this.map.clearActiveObject();
        this.map.requestRender();
    }

    setup() {
        this.mapObject.addStyle( this.mapObjectStyle );
        this.map.setActiveObject( this.mapObject );
        this.parentTask.createLinkPanel( this.widgetParams );
        if ( this.mapObject.getPointList().length > 0 ) {
            this.mapObject.removeAllPoints();
        }
    }

    commit() {
        super.commit();
        if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            if ( this.parentTask.getWidgetPropsCurrentMapObject() ) {
                this.action.commit();
                this.run();
            }
        } else {
            this.setLinkAction();
        }
    }

    revert() {
        this.setLinkAction();
    }

    run() {
        if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            if ( this.mapObject.getPointList().length >= 1 ) {
                this.parentTask.setWidgetPropsCurrentMapObject( this.mapObject );
                this.parentTask.getObjectPropsFromDBForPlantBreeders().then();
                this.parentTask.selectedActionType( this.action.id );
            }
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        this.parentTask.selectedMapObjectInMap = undefined;

        this.mapWindow.getTaskManager().showOverlayPanel();
        this.map.searchManager.findInPoint( event.mousePosition, GISWebServiceSEMode.StrictSearch ).then( () => {
        } ).catch( () => {
        } ).finally(
            () => {
                this.mapWindow.getTaskManager().removeOverlayPanel();
            }
        );
    }

    canSelectObject(): boolean {
        return false;
    }

    selectObject( mapObject?: MapObject ): void {
        super.selectObject( mapObject );
        if ( mapObject && mapObject.getPointList().length > 0 ) {
            this.mapObject = mapObject.copy();
            this.setLinkAction( EDIT_MODE_ACTION );
            this.setState( EDIT_MODE_ACTION, true );
            return this.run();
        }
    }

    setState<K extends keyof GwtKPlantBreederTaskState>( key: K, value: GwtKPlantBreederTaskState[K] ) {
        switch ( key ) {
            case START_MODE_ACTION:
                this.parentTask.getPlantBreederMapObjectsList(false);
                this.toggleGwtkMapObjectPanel(false);
                this.parentTask.selectedMapObjectInMap = undefined;
                break;
            case EDIT_MODE_ACTION:
                if ( this.mapObject.getPointList().length === 0 ) {
                    this.changeActionActive( EDIT_MODE_ACTION );
                    this.parentTask.setLinkPanelActiveState('edit');
                    this.parentTask.getPlantBreederMapObjectsList(false);
                    this.setLinkAction( EDIT_MODE_ACTION );
                } else {
                    super.setState( key, value );
                }
                this.toggleGwtkMapObjectPanel(false);
                break;
            case DELETE_MODE_ACTION:
                this.mapObject.removeAllPoints();
                this.map.setActiveObject( this.mapObject );
                if ( this.action ) {
                    this.parentTask.selectedActionType( this.action.id );
                }
                this.setState( EDIT_MODE_ACTION, true );
                this.parentTask.selectedMapObjectInMap = undefined;
                break;
            default:
                super.setState( key, value );
                break;
        }
    }

    /**
     * Изменить активность кнопок линкования
     */
    changeActionActive( value: string ) {
        this.widgetParams.forEach( (paramName:string) => {
            const actionModeDescription = this.parentTask.getActionDescription( paramName );
            if ( actionModeDescription && actionModeDescription.id === value ) {
                actionModeDescription.active = true;
            } else if ( actionModeDescription ) {
                actionModeDescription.active = false;
            }
        });
    }

    /**
     * Включить или выключить отображения панеля объекты карты
     * @method toggleGwtkMapObjectPanel
     * @param toggle {Boolean}
     */
    private toggleGwtkMapObjectPanel(toggle: boolean) {
        const taskDescription= this.parentTask.mapWindow.getTaskManager().getTaskDescription('gwtkmapobject.main');
        if ( taskDescription ) {
            taskDescription.enabled = toggle;
        }
    }
}
