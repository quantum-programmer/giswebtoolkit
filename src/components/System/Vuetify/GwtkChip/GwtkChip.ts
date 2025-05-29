import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkChip extends Vue {

    @Prop( { default: false } )
    private readonly withClose!: boolean;

}