import { VueConstructor } from 'vue';

export type GwtkComponentSource = (() => Promise<VueConstructor>) | VueConstructor;