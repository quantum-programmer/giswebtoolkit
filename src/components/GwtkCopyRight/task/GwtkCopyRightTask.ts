/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                  Компонент Информация о правообладателе          *
 *                                                                  *
 *******************************************************************/
import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import GwtkCopyRightWidget from '@/components/GwtkCopyRight/task/GwtkCopyRightWidget.vue';
import { CopyRightSettings, PrivacyPolicySettings } from '~/types/Options';

type WidgetParams = {
    setState: GwtkCopyRightTask['setState'];
    nameCompany?: string;
    privacyPolicy?: PrivacyPolicySettings | undefined
}

/**
 * Компонент "Информация о правообладателе"
 * @class GwtkCopyRightTask
 * @extends Task
 * @description
 */
export default class GwtkCopyRightTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * @constructor GwtkCopyRightTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor( mapWindow: MapWindow, id: string ) {
        super( mapWindow, id );
        const copyRightOptions = this.map.options.copyright;
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription( this.id ),
            setState: this.setState.bind( this ),
            nameCompany: copyRightOptions ? this.getNameCompany( copyRightOptions ) : undefined,
            privacyPolicy: copyRightOptions ? this.getPrivacyPolicy( copyRightOptions ) : undefined
        };
    }

    /**
     * Имя правообладателя
     * @param copyRightOptions
     */
    getNameCompany( copyRightOptions: CopyRightSettings ) {
        if ( copyRightOptions && copyRightOptions.name ) {
            const name = copyRightOptions.name || '';
            const startYear = copyRightOptions.startYear || '';
            let endYear = copyRightOptions.endYear;
            if ( !endYear ) {
                endYear = new Date().getFullYear().toString();
            }
            let date = endYear;
            if ( startYear ) {
                date = startYear + '—' + endYear;
            }

            return '© ' + date + ' ' + name;
        }
        return undefined;
    }

    /**
     * Политика конфиденциальности
     * @param copyRightOptions
     */
    getPrivacyPolicy( copyRightOptions: CopyRightSettings ) {
        if ( copyRightOptions && copyRightOptions.privacyPolicy && copyRightOptions.privacyPolicy.alias ) {
            return {
                alias: copyRightOptions.privacyPolicy.alias,
                url: copyRightOptions.privacyPolicy.url || ''
            };
        }
        return undefined;
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkCopyRightWidget';
        const sourceWidget = GwtkCopyRightWidget;
        this.mapWindow.registerComponent( nameWidget, sourceWidget );

        // Создание Vue компонента
        this.mapWindow.createFooterWidget( nameWidget, this.widgetProps );

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList( this.widgetProps );
    }

}
