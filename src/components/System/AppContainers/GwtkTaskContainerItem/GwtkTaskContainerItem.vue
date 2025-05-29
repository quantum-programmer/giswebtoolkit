<template>
    <gwtk-task-card
        class="gwtk-task-card"
        :title="$t(description.options.title)"
        :help-page-exists="mapVue.getTaskManager().checkHelpPage(taskId)"
        :stored-data="mapVue.getTaskManager().storedData(taskId)"
        :title-background-color="titleBackgroundColor"
        :title-text-color="titleTextColor"
        :is-reduced-size-interface="isReducedSizeInterface"
        @help="openHelp"
        @close="onClick"
        @clear="clear"
    >
        <slot />
    </gwtk-task-card>
</template>

<script lang="ts" src="./GwtkTaskContainerItem.ts" />

<style scoped>
    .gwtk-task-card {
        box-shadow: var(--shadow-grey);
        pointer-events: all;
        height: 100%;
    }
</style>