<template>
    <gwtk-window-item
        v-if="$vuetify.breakpoint.width > 1280"
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-width="600"
        :min-height="540"
    >
        <slot />
    </gwtk-window-item>
    <gwtk-task-container-item
        v-else
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="200"
    >
        <slot />
    </gwtk-task-container-item>
</template>
<script lang="ts" src="./GwtkMatrixControlContainerItem.ts" />