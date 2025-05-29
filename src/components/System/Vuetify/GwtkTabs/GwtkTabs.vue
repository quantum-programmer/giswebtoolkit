<template>
    <v-tabs
        :value="value"
        class="gwtk-tabs"
        hide-slider
        active-class="gwtk-tab-active"
        background-color="transparent"
        @change="updateModelValue"
    >
        <slot />
    </v-tabs>
</template>

<script lang="ts" src="./GwtkTabs.ts"></script>

<style>
    div.gwtk-tabs.v-tabs > .v-slide-group.v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__prev.v-slide-group__prev--disabled {
        display: none;
    }
    div.gwtk-tabs.v-tabs > .v-tabs-bar{
        height: var(--list-item-min-height);
    }
</style>
