<template>
    <gwtk-draggable-resizable
        v-if="showDialog"
        :min-width="minWidth"
        :min-height="minHeight"
        :initial-position="initialPosition"
        @resize="(e)=>onResize(e)"
    >
        <gwtk-task-card
            class="gwtk-draggable-task-card"
            :title="title"
            :help-page-exists="mapVue.getTaskManager().checkHelpPage(taskId)"
            :stored-data="mapVue.getTaskManager().storedData(taskId)"
            window-mode
            :title-background-color="titleBackgroundColor"
            :title-text-color="titleTextColor"
            :is-reduced-size-interface="isReducedSizeInterface"
            @mousedown="onMouseDown"
            @help="openHelp"
            @close="onClose"
            @clear="clear"
        >
            <slot />
        </gwtk-task-card>
    </gwtk-draggable-resizable>
</template>

<script lang="ts" src="./GwtkWindowItem.ts" />

<style scoped>

    .gwtk-draggable-task-card {
        height: 100%;
        max-width: 100%;
    }

</style>