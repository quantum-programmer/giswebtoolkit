import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkSelectable extends Vue {

    @Prop( { default: false } )
    private readonly fill!: boolean | '';

    @Prop( { default: false } )
    private readonly border!: boolean | '';

    @Prop( { default: false } )
    private readonly disabled!: boolean | '';

}