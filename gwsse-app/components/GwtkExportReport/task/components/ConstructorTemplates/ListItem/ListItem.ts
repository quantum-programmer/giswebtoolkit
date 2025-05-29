import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';
import {
    ExportReportConstructorOptionsExtended,
    ExportReportSelectTemplateParameters,
    ExportReportTemplateType
} from '../../../Types';

@Component
export default class ListItem extends Vue {

    @Prop({default: () => ({})})
    private readonly template!: ExportReportConstructorOptionsExtended;

    @Prop({default: 0})
    private readonly templateIndex!: number;

    @Prop({default: false})
    private readonly isPublic!: boolean;

    @Prop({default: false})
    private readonly isAdmin!: boolean;

    get templateOptions(): ExportReportSelectTemplateParameters {
        return {
            templateIndex: this.templateIndex,
            templateType: this.isPublic ? ExportReportTemplateType.Public : ExportReportTemplateType.Personal
        };
    }

    checkTemplate(): void {
        this.$emit('checkTemplate', this.templateOptions);
    }

    exportTemplate(): void {
        this.$emit('exportTemplate', this.templateOptions);
    }

    deleteTemplate(): void {
        this.$emit('deleteTemplate', this.templateOptions);
    }

    publicTemplate(): void {
        this.$emit('publicTemplate', this.templateIndex);
    }

}
