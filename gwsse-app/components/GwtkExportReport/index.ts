import MapWindow from '~/MapWindow';
import i18n from '@/plugins/i18n';
import ruRu from './locale/ru-ru.json';

export const EXPORT_REPORT_COMPONENT = 'gwtkexportreport.main';

export function GwtkExportReport(mapWindow: MapWindow) {
    i18n.mergeLocaleMessage('ru-ru', ruRu);
    i18n.mergeLocaleMessage('en-en', ruRu);

    const taskDescription = {
        id: EXPORT_REPORT_COMPONENT,
        getConstructor: () => import('./task/GwtkExportReportTask').then(m => m.default),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-file-document-arrow-right-outline',
            title: 'exportReport.Export Report',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
}
