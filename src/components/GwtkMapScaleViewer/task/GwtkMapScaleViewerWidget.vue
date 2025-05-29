<template>
    <v-row
        dense
        no-gutters
        class="gwtk-container"
        justify="space-around"
        align-content="center"
        @click="changeMode"
    >
        <v-sheet class="container-block rounded" />
        <v-col class="container-body text-center text-caption">
            <template v-if="rulermode">
                <div
                    class="scale-line"
                    :style="rulerStyle"
                />
                <div class="scale-line-text">
                    {{ ruleroptions.text }}
                </div>
            </template>
            <template v-else>
                <div class="text-body-1">
                    {{ scaleValue }}
                </div>
            </template>
        </v-col>
    </v-row>
</template>

<script src="./GwtkMapScaleViewerWidget.ts" />

<style scoped>
.gwtk-container {
    position: relative;
    height: 100%;
    width: 7em;
}

.container-body {
    cursor: pointer;
}

.container-block {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    opacity: 0.8;
    z-index: -1;
}

.container-body > :not(.scale-line) {
    text-align: center;
}

.container-body > .scale-line {
    position: absolute;
    top: var(--scale-line-top);
    right: 0;
    left: 0;
    margin: 0 auto;
    border: 2px solid currentColor;
    border-radius: 0;
}
.scale-line-text {
    margin-top: var(--scale-line-margin);
    margin-bottom: var(--scale-line-margin);
}
</style>