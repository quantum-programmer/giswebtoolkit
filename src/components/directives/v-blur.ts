import Vue from 'vue';

Vue.directive( 'blur', {
    inserted: function ( el ) {
        el.onfocus = ( ev: FocusEvent ) => (ev.target as HTMLElement).blur();
    }
} );