import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import BaseComponentWidget from './BaseComponentWidget';

export type BaseComponentTaskState = {
}

type WidgetParams = {
    setState: BaseComponentTask['setState']
}

export default class BaseComponentTask extends Task {


    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
        };
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'BaseComponentWidget';
        const sourceWidget = BaseComponentWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    setState<K extends keyof BaseComponentTaskState>(key: K, value: BaseComponentTaskState[K]) {

    }

}