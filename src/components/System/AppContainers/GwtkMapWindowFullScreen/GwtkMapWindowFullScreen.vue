<template>
    <div
        v-if="component"
        v-show="!sidebarIsActive"
        style="position:absolute;width:100%; overflow-y: auto; z-index: 3"
        :class="$vuetify.breakpoint.xsOnly? 'mobile':'other-device'"
    >
        <component
            :is="component.name"
            :key="component.name"
            v-bind="{...component.propsData, mapVue}"
        />
    </div>
</template>

<script lang="ts" src="./GwtkMapWindowFullScreen.ts" />

<style scoped>
    .mobile {
        max-height: calc(100vh - 48px);
    }

    .other-device {
        min-height: 100vh;
    }
</style>