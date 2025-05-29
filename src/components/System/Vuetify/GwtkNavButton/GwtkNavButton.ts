import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkNavButton extends Vue {

    @Prop( { required: true } )
    private readonly name!: string;

    @Prop( { required: true } )
    private readonly icon!: string;

    @Prop( { default: false } )
    private readonly selected!: boolean;

    @Prop( { default: false } )
    private readonly disabled!: boolean;

    @Prop( { default: false } )
    private readonly listItem!: boolean;

    @Prop( { default: () => ({}) } )
    private readonly linkObject!: { href: string; target?: string; };

}