<template>
    <div class="gwtk-task-card-text px-2 pt-1">
        <slot />
    </div>
</template>

<script lang="ts" src="./GwtkTaskBottomContainerItem.ts" />

<style scoped>
    .gwtk-task-card-text {
        width: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        display: block;
        pointer-events: all;
    }
</style>
