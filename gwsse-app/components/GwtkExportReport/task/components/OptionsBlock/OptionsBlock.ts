import {Component, Prop} from 'vue-property-decorator';
import Vue from 'vue';

@Component
export default class OptionsBlock extends Vue {

    @Prop({default: false})
    private readonly show!: boolean;

    @Prop({default: ''})
    private readonly label!: string;

    @Prop({default: () => ([])})
    private readonly rules!: ((v: string) => boolean | string)[];

    protected setShow(value: boolean): void {
        this.$emit('setShow', value);
    }

}
