/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          Обработчик устоновки и редактирования пасек для         *
 *                 "Пчеловода работника Минсельхоза"                *
 *                                                                  *
 *******************************************************************/


import ActionLink from '~/taskmanager/ActionLink';
import GwtkBeekeeperStaticTask, {
    CREATE_MODE_ACTION, DELETE_MODE_ACTION,
    EDIT_MODE_ACTION, GwtkBeekeeperStaticTaskState
} from '@/components/GwtkBeekeeperStatic/task/GwtkBeekeeperStaticTask';
import SVGrenderer from '~/renderer/SVGrenderer';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import MapObject from '~/mapobject/MapObject';

/**
 * Обработчик устоновки и редактирования постоянных пасек в виде точок
 * @class
 * @extends ActionLink<GwtkBeekeeperStaticTask>
 */
export default class ControlBeekeeperStaticPointActionLink extends ActionLink<GwtkBeekeeperStaticTask> {

    /**
     * Редактируемый объект
     * @private
     * @readonly
     * @property mapObject {MapObject}
     */
    private readonly mapObject = this.parentTask.editableSelectedMapObjectInMap;

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = [
        CREATE_MODE_ACTION,
        EDIT_MODE_ACTION,
        DELETE_MODE_ACTION
    ];

    private readonly MAX_POINT_COUNT = 1;

    destroy() {
        super.destroy();
        this.toggleGwtkMapObjectPanel(true);
        if ( this.mapObject ) {
            this.mapObject.removeAllPoints();
            this.map.clearActiveObject();
            this.map.requestRender();
        }
    }

    setup() {
        if ( this.mapObject ) {
            this.map.setActiveObject( this.mapObject );

            if ( this.mapObject.getPointList().length > 0 ) {
                this.setLinkAction( EDIT_MODE_ACTION );
            } else {
                this.setLinkAction( CREATE_MODE_ACTION );
            }
        }
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.mapObject ) {
            super.onPreRender( renderer );
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.mapObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.mapObject );
            super.onPostRender( renderer );
        }
    }

    commit() {
        if ( this.action ) {
            if ( this.action.id === CREATE_MODE_ACTION ) {
                this.setLinkAction();
                if ( this.mapObject ) {
                    this.map.setActiveObject( this.mapObject );

                    if ( this.mapObject.getPointList().length === this.MAX_POINT_COUNT ) {
                        this.setLinkAction( EDIT_MODE_ACTION );
                    } else {
                        this.setLinkAction( CREATE_MODE_ACTION );
                    }
                }
            } else if( this.action.id === EDIT_MODE_ACTION ) {
                if ( this.mapObject ) {
                    this.run();
                } else {
                    this.setLinkAction();
                }
            } else {
                this.setLinkAction();
            }
        } else {
            this.setLinkAction();
        }
    }

    revert() {
        this.setLinkAction();
    }

    run() {

    }

    onMouseClick( event: MouseDeviceEvent ) {
        super.onMouseClick( event );
        if ( this.action && this.action.id === CREATE_MODE_ACTION ) {
            if ( this.mapObject ) {
                if ( this.MAX_POINT_COUNT <= this.mapObject.getPointList().length ) {
                    this.parentTask.quitAction( this.action.id );
                }
            }
        }
    }

    selectObject( mapObject?: MapObject ): void {
        super.selectObject( mapObject );
        if ( this.action && this.action.id === EDIT_MODE_ACTION ) {
            this.run();
        }
    }

    setState<K extends keyof GwtkBeekeeperStaticTaskState>( key: K, value: GwtkBeekeeperStaticTaskState[K] ) {
        switch ( key ) {
            case CREATE_MODE_ACTION:
                if ( this.mapObject && this.mapObject.getPointList().length === 0 ) {
                    this.setLinkAction( CREATE_MODE_ACTION );
                } else {
                    super.setState( key, value );
                }
                this.toggleGwtkMapObjectPanel( false );
                this.parentTask.selectedMapObjectInMap = undefined;
                this.setup();
                break;
            case EDIT_MODE_ACTION:
                if ( this.mapObject && this.mapObject.getPointList().length === 0 ) {
                    this.setLinkAction( EDIT_MODE_ACTION );
                } else {
                    super.setState( key, value );
                }
                this.toggleGwtkMapObjectPanel( false );
                this.parentTask.selectedMapObjectInMap = undefined;
                break;
            case DELETE_MODE_ACTION:
                this.destroy();
                break;
            default:
                super.setState( key, value );
                break;
        }
    }

    /**
     * Включить или выключить отображения панеля объекты карты
     * @private
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
