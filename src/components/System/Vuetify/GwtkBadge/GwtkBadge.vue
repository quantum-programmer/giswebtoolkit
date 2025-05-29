<template>
    <v-badge
        class="gwtk-badge"
        :class="{
            'gwtk-badge-selected': disabled===false
        }"
        overlap
        :color="currentColor"
        :content="count"
        :value="!!count"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <slot v-bind="{disabled}" />
    </v-badge>
</template>

<script lang="ts" src="./GwtkBadge.ts"></script>

<style>
    .gwtk-badge.gwtk-badge-selected .v-badge__badge {
        background:  var(--v-primary-lighten4);
        color: var(--v-primary-base);
    }
</style>