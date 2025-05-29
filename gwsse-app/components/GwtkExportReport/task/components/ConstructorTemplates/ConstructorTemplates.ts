import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';
import {ExportReportSelectTemplateParameters, ExportReportTemplateType, ExportReportWidgetParams} from '../../Types';
import {
    EXPORT_REPORT_ADD_TEMPLATE,
    EXPORT_REPORT_DELETE_TEMPLATE,
    EXPORT_REPORT_EXPORT_TEMPLATE,
    EXPORT_REPORT_IMPORT_TEMPLATE,
    EXPORT_REPORT_PUBLIC_TEMPLATE,
    EXPORT_REPORT_SELECT_TEMPLATE
} from '../../GwtkExportReportTask';
import ListItem from './ListItem/ListItem.vue';
import VueMapWindow from '@/components/VueMapWindow';

@Component({
    components: {
        ListItem
    }
})
export default class ConstructorTemplates extends Vue {

    @Prop({default: () => ([])})
    private readonly constructorTemplatesPublic!: ExportReportWidgetParams['constructorTemplatesPublic'];

    @Prop({default: () => ([])})
    private readonly constructorTemplatesLocal!: ExportReportWidgetParams['constructorTemplatesLocal'];

    @Prop({default: false})
    private readonly formIsValid!: boolean;

    @Prop({default: () => ({})})
    private readonly setState!: ExportReportWidgetParams['setState'];

    @Prop({default: false})
    private readonly isLogged!: boolean;

    @Prop({default: false})
    private readonly isAdmin!: boolean;

    @Prop({default: ''})
    private readonly userName!: string;

    @Prop({required: true})
    private readonly mapVue!: VueMapWindow;

    private templateType: ExportReportTemplateType = ExportReportTemplateType.Public;

    private enterTitleVisible: boolean = false;

    private templateTitle: string = '';

    private templateIndexSelected: number = -1;
    private templateTypeSelected: ExportReportTemplateType = ExportReportTemplateType.Public;

    private listItem: number | undefined = -1;

    get templateParameters(): ExportReportSelectTemplateParameters {
        return {
            templateIndex: this.templateIndexSelected,
            templateType: this.templateTypeSelected
        };
    }

    set templateParameters(parameters: ExportReportSelectTemplateParameters) {
        this.templateIndexSelected = parameters.templateIndex;
        this.templateTypeSelected = parameters.templateType;
    }

    addTemplate(isPublic: boolean): void {
        if (this.enterTitleVisible) {
            return this.addTemplateSubmit();
        }

        if (isPublic) {
            this.templateType = ExportReportTemplateType.Public;
        } else {
            this.templateType = ExportReportTemplateType.Personal;
        }

        this.templateTitle = '';
        this.enterTitleVisible = true;
    }

    addTemplateSubmit(): void {
        if (!this.templateTitle) {
            return;
        }
        this.enterTitleVisible = false;
        this.setState(EXPORT_REPORT_ADD_TEMPLATE, {templateTitle: this.templateTitle, templateType: this.templateType});
    }

    importTemplate(isPublic: boolean): void {
        if (isPublic) {
            this.setState(EXPORT_REPORT_IMPORT_TEMPLATE, ExportReportTemplateType.Public);
        } else {
            this.setState(EXPORT_REPORT_IMPORT_TEMPLATE, ExportReportTemplateType.Personal);
        }
    }

    checkTemplate(templateParameters: ExportReportSelectTemplateParameters): void {
        this.templateParameters = templateParameters;
    }

    selectTemplate(): void {
        this.setState(EXPORT_REPORT_SELECT_TEMPLATE, this.templateParameters);
        this.switchToSettingsTab();
    }

    switchToSettingsTab(): void {
        this.$emit('switchToSettingsTab');
    }

    exportTemplate(templateParameters: ExportReportSelectTemplateParameters): void {
        this.setState(EXPORT_REPORT_EXPORT_TEMPLATE, templateParameters);
    }

    deleteTemplate(templateParameters: ExportReportSelectTemplateParameters): void {
        this.mapVue.showInputText({
            titleText: this.$tc('phrases.Confirm action'),
            description: this.$tc('exportReport.Confirm template deletion'),
        }).then(() => {
            this.setState(EXPORT_REPORT_DELETE_TEMPLATE, templateParameters);
        }).catch(error => console.log(error));
    }

    publicTemplate(templateIndex: number): void {
        this.setState(EXPORT_REPORT_PUBLIC_TEMPLATE, templateIndex);
    }

}
