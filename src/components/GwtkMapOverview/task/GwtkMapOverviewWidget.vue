<template>
    <div
        v-show="$vuetify.breakpoint.smAndUp"
        class="gwtk-mapoverview-main"
        :style="{
            width: active? width+'px':0,
            height:active? height+'px':0,
            border: active? '1px solid grey':''
        }"
    >
        <div
            v-show="showMap"
            :id="guid"
            :style="{
                transition: 'all .2s linear',
                width:width+'px',
                height:height+'px'
            }"
        />
        <gwtk-tool-button
            icon="mdi-arrow-bottom-right-bold-box-outline"
            class="gwtk-mapoverview-button"
            :class="active?'':'gwtk-mapoverview-button-rotation'"
            :tooltip-text="$t(description.options.title)"
            position="left"
            @click="toggle"
        />
    </div>
</template>
<script src="./GwtkMapOverviewWidget.ts" />

<style scoped>
    .gwtk-mapoverview-main {
        display: block;
        position: absolute;
        z-index: 1;
        bottom: 38px;
        right: 12px;
        transition: all .2s linear;
        box-sizing: content-box;

        background-color: var(--color-white);
    }

    .gwtk-mapoverview-button {
        position: absolute;
        bottom: 0;
        right: 0;
        z-index: 1;
        opacity: 0.5;
        transition: opacity 0.2s;
        min-width: 24px;
        box-sizing: border-box;
    }

    .gwtk-mapoverview-button:hover{
        opacity: 1;
    }

    .gwtk-mapoverview-button-rotation {
        transform: rotate(180deg);
        right: 0;
    }
</style>
