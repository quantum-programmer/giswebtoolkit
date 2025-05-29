<template>
    <div
        v-if="$vuetify.breakpoint.smAndUp"
        v-show="showItem"
        class="gwtk-draggable-parent"
    >
        <template v-for="component in components">
            <component
                :is="component.name"
                :key="component.propsData.taskId"
                v-bind="{...component.propsData, mapVue}"
            />
        </template>
    </div>
</template>

<script lang="ts" src="./GwtkWindow.ts" />

<style scoped>
    .gwtk-draggable-parent {
        width: calc(100% - 8px);
        height: calc(100% - 48px);
        min-height: 576px;
        position: absolute;
        top:0;
        left:0;
        z-index: 6;
        pointer-events: none;
    }
</style>


