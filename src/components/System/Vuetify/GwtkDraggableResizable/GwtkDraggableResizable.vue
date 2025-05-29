<template>
    <VueDraggableResizable
        class="gwtk-draggable-item"
        class-name-handle="handle"
        drag-handle=".gwtk-draggable-item-drag-icon"
        :w="w"
        :h="h"
        :x="x"
        :y="y"
        :min-height="minHeight"
        :min-width="minWidth"
        :parent="true"
        :active="true"
        :prevent-deactivation="true"
        @resizing="onResizing"
        @dragging="onResizing"
    >
        <div class="gwtk-draggable-item-drag-icon" />
        <slot />
    </VueDraggableResizable>
</template>

<script lang="ts" src="./GwtkDraggableResizable.ts"></script>

<style scoped>
    .gwtk-draggable-item {
        border: none;
        pointer-events: all;
        max-height: 100%;
        max-width: 100%;
    }

    .gwtk-draggable-item-drag-icon {
        position: absolute;
        width: calc(100% - 150px);
        height: var(--gwtk-task-card-title-height);
        opacity: 0;

        border-top-left-radius: 4px;
        border-top-right-radius: 4px;

        z-index: 1;
        cursor: grab;
    }

    .gwtk-draggable-item-drag-icon:active {
        cursor: grabbing;
    }

    .theme--light .gwtk-draggable-item-drag-icon {
        background-color: var(--v-secondary-lighten5);
    }

    .theme--dark .gwtk-draggable-item-drag-icon {
        background-color: var(--v-secondary-lighten1);
    }

</style>

<style>

    .gwtk-draggable-item > .handle {
        opacity: 0;
        z-index: 1;
        position: absolute;
    }

    .gwtk-draggable-item > .handle-tr {
        width: 10px;
        height: 10px;
        top: 0;
        right: 0;
        z-index: 2;
    }

    .gwtk-draggable-item > .handle-tl {
        width: 10px;
        height: 10px;
        top: 0;
        left: 0;
        z-index: 2;
    }

    .gwtk-draggable-item > .handle-bl {
        width: 10px;
        height: 10px;
        bottom: 0;
        left: 0;
        z-index: 2;
    }

    .gwtk-draggable-item > .handle-br {
        width: 10px;
        height: 10px;
        bottom: 0;
        right: 0;
        z-index: 2;
    }

    .gwtk-draggable-item > .handle-tm {
        width: 96%;
        height: 7px;
        left: 3%;
        top: 0;
    }

    .gwtk-draggable-item > .handle-bm {
        width: 96%;
        height: 7px;
        left: 3%;
        bottom: 0;
    }

    .gwtk-draggable-item > .handle-mr {
        height: 96%;
        width: 7px;
        top: 3%;
        right: 0;
    }

    .gwtk-draggable-item > .handle-ml {
        height: 96%;
        width: 7px;
        top: 3%;
        left: 0;
    }

</style>
