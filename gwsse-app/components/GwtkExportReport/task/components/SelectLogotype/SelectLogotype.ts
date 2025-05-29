import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';
import {ExportReportLogotypeItem} from '../../../../../service/GISWebServerSEService/Types';


@Component
export default class SelectLogotype extends Vue {

    @Prop({default: []})
    private readonly logotypes!: ExportReportLogotypeItem[];

    @Prop({default: -1})
    private readonly logotype!: number;

    protected previewingLogotype: ExportReportLogotypeItem | false = false;

    protected setLogotype(value?: number): void {
        if (value === undefined) {
            value = -1;
        }
        this.$emit('setLogotype', value);
    }

    protected previewLogotype(logotypeIndex: number): void {
        this.previewingLogotype = this.logotypes[logotypeIndex];
        this.$nextTick(() => {
            this.blurListItem(logotypeIndex);
        });
    }

    protected blurListItem(logotypeIndex: number): void {
        const itemElement = document.body.querySelector('.export-report__logotype-' + logotypeIndex) as HTMLDivElement;
        itemElement?.blur();
    }

    protected closePreview(): void {
        this.previewingLogotype = false;
    }

}
