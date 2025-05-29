<template>
    <v-tab
        class="gwtk-tab mr-3 pa-0 pb-1"
        :href="$vnode.key? '#'+$vnode.key:undefined"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <span
            v-if="$attrs.title"
            class="gwtk-tab-text-color gwtk-tab-caption"
            :style="{color:$attrs.color?$attrs.color:''}"
        >
            {{ $attrs.title }}
        </span>
        <slot />
    </v-tab>
</template>

<script lang="ts" src="./GwtkTab.ts"></script>

<style scoped>
    .gwtk-tab.v-tab {
        /*line-height: var(--line-height-m);*/
        /*text-transform: none;*/
    }
    .gwtk-tab {
        text-transform: inherit;
        height: var(--treeview-node-content-btn-height);
    }

    .gwtk-tab .gwtk-button {
        /*font-weight: 500;*/
    }

    .gwtk-tab-active::after {
        content: "";
        position: absolute;
        left: var(--space-s);
        right: var(--space-s);
        bottom: 0;
        height: 4px;
        border-radius: 8px 8px 0 0;
        background: var(--v-primary-base);
        opacity: 1;
    }

    .gwtk-tab-text-color .v-tab:not(.v-tab--active) {
        color: var(--v-secondary-lighten2);
    }

    .gwtk-tab-caption {
        /*height: 100%;*/
        width: 100%
    }
</style>
