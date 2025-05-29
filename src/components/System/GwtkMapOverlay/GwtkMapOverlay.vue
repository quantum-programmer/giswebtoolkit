<template>
    <gwtk-overlay
        v-if="handleClose"
        :value="searchAppProgressBar"
        absolute
        z-index="100"
        @close="closeOverlay"
    />
    <gwtk-overlay
        v-else
        :value="searchAppProgressBar"
        absolute
        z-index="100"
    />
</template>

<script lang="ts" src="./GwtkMapOverlay.ts" />

