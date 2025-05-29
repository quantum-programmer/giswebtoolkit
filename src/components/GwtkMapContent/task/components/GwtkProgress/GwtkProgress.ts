import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class GwtkProgress extends Vue {

    @Prop({ default: false })
    private readonly visible!: boolean;

    @Prop({ default: false })
    private readonly indeterminate!: boolean;

    @Prop({ default: 0 })
    private readonly percent!: number;

}
