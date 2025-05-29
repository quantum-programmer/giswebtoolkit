import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkPage extends Vue {

    @Prop( { default: '' } )
    private readonly title!: string;

    @Prop( { default: '' } )
    private readonly icon!: string;

    @Prop( { default: undefined } )
    private readonly headerHeight!: string;

    @Prop( { default: false } )
    private readonly withoutHeader!: boolean | '';

    get contentStyle() {
        if ( !this.withoutHeader && this.withoutHeader !== '' ) {
            return 'height: calc(100% - 48px);';
        } else {
            return 'height: 100%;';
        }
    }

}