import Action from '~/taskmanager/Action';
import GwtkShutterTask, { SET_SHUTTER_POSITION } from '@/components/GwtkShutter/task/GwtkShutterTask';
import { MouseDeviceEvent } from '~/input/MouseDevice';


export default class GwtkShutterAction extends Action<GwtkShutterTask> {

    canMapMove(): boolean {
        return false;
    }

    onMouseMove( event: MouseDeviceEvent ) {

        let { left, top } = this.parentTask.shutter;

        if ( this.parentTask.widgetProps.verticalMode ) {
            left = event.mousePosition.x;
        } else {
            top = event.mousePosition.y;
        }
        this.parentTask.setState( SET_SHUTTER_POSITION, {
            left,
            top
        } );
    }

    onMouseUp( event: MouseDeviceEvent ) {
        this.parentTask.quitAction( this.id );
    }

}