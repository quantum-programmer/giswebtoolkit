import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { GwtkMapContentTaskState, ON_TAG_SEARCH } from '@/components/GwtkMapContent/task/GwtkMapContentTask';

@Component
export default class GwtkTags extends BaseGwtkVueComponent {
    @Prop( { default: () => ({}) } )
    private readonly tags!: string[];

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkMapContentTaskState>( key: K, value: GwtkMapContentTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly selectedTags!: string[];

    public expandTags: boolean = false;

    get tagsContainerClasses() {
        if ( this.expandTags ) {
            return 'mr-2';
        }
        return 'mr-2 d-flex flex-column overflow-x-auto flex-wrap';
    }

    get tagsContainerStyles() {
        return {
            height: this.expandTags ? 'auto' : '48px',
            minHeight: '48px'
        };
    }

    get toggleButtonIcon() {
        if ( this.expandTags ) {
            return 'dropdown-arrow-up';
        }
        return 'dropdown-arrow';
    }

    itemColor( tag: string ) {
        if ( this.isItemActive( tag ) ) {
            return 'var(--v-primary-lighten4)';
        }
        return 'transparent';
    }

    isItemActive( tag: string ) {
        return this.selectedTags.includes( tag );
    }

    emitSelected( tag: string ) {
        const newValue = this.selectedTags.slice();
        const index = newValue.indexOf( tag );
        if ( index === -1 ) {
            newValue.push( tag );
        } else {
            newValue.splice( index, 1 );
        }

        this.$nextTick( () => {
            this.setState( ON_TAG_SEARCH, newValue );
        } );
    }

    toggleTags() {
        this.expandTags = !this.expandTags;
    }
}
