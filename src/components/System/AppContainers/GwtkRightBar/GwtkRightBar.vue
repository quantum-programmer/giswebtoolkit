<template>
    <div v-if="$vuetify.breakpoint.smAndUp" class="right_bar d-flex mr-4">
        <div class="align-start justify-start flex-column">
            <v-sheet
                v-for="(component, index) in components"
                :key="index"
                class="filled-button"
            >
                <component
                    :is="component.name"
                    v-if="component.propsData.taskId.search(/scaler_button/ig) === -1&&component.propsData.taskId.search(/mode_button/ig) === -1"
                    class="mb-1"
                    :position="'left'"
                    v-bind="{...component.propsData, mapVue}"
                />
            </v-sheet>
        </div>
        <div class="align-start justify-start flex-column mt-2">
            <v-sheet
                v-for="(component, index) in components"
                :key="index"
                class="filled-button"
            >
                <component
                    :is="component.name"
                    v-if="component.propsData.taskId.search(/scaler_button/ig) !== -1"
                    class="mb-1"
                    v-bind="{...component.propsData, mapVue}"
                />
            </v-sheet>
        </div>
        <div class="align-start justify-start flex-column mt-2">
            <v-sheet
                v-for="(component, index) in components"
                :key="'mode_'+index"
                class="filled-button"
            >
                <component
                    :is="component.name"
                    v-if="component.propsData.taskId.search(/mode_button/ig) !== -1"
                    :without-tooltip="true"
                    v-bind="{...component.propsData, mapVue}"
                />
            </v-sheet>
        </div>
    </div>
</template>

<script lang="ts" src="./GwtkRightBar.ts" />

<style scoped>
    .right_bar {
        flex-direction: column;
        justify-content: space-between;
        position: absolute;
        right: 0;
        top: 12%;
        bottom: 18%;
        z-index: 2;
    }

    .filled-button {
        border-radius: var(--border-radius-s);
    }
</style>
