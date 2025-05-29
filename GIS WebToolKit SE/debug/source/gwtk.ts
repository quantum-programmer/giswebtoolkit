declare var GWTK: any;
declare module 'vue-draggable-resizable';

declare var hex_md5: ( value: string ) => string;

('object' == typeof globalThis) ? globalThis.GWTK = { version: '6.23.0' } : window.GWTK = { version: '6.23.0' };
