import Vue from 'vue';
import './components';
import { GwtkFillEditor } from './GwtkFillEditor';
import { GwtkHatchEditor } from './GwtkHatchEditor';
import { GwtkStrokeEditor } from './GwtkStrokeEditor';
import { GwtkTextStyleEditor } from './GwtkTextStyleEditor';


Vue.component( 'GwtkFillEditor', GwtkFillEditor );
Vue.component( 'GwtkHatchEditor', GwtkHatchEditor );
Vue.component( 'GwtkStrokeEditor', GwtkStrokeEditor );
Vue.component( 'GwtkTextStyleEditor', GwtkTextStyleEditor );
