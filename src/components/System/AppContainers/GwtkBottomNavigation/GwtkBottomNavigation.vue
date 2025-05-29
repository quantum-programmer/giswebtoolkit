<template>
    <v-bottom-navigation
        class="gwtk-bottom-navigation py-1"
        fixed
        v-bind="$attrs"
        :value="selectedIndex"
        v-on="$listeners"
        @change="$emit('input', $event)"
    >
        <template v-for="(component, index) in components">
            <component
                :is="component.name"
                v-if="index < 4"
                :key="index"
                :list-item="false"
                v-bind="{...component.propsData, mapVue}"
            />
            <component
                :is="component.name"
                v-if="index === 4&&components.length===5"
                :key="index"
                :list-item="false"
                v-bind="{...component.propsData, mapVue}"
            />
        </template>
        <v-menu
            v-if="components.length > 5"
            top
            offset-y
            max-height="90%"
        >
            <template #activator="{ on, attrs }">
                <gwtk-nav-button
                    icon="other"
                    icon-size="22"
                    :name="$t('phrases.Other')"
                    v-bind="attrs"
                    v-on="on"
                />
            </template>
            <v-list>
                <template v-for="(component, index) in components">
                    <component
                        :is="component.name"
                        v-if="index >= 4"
                        :key="index"
                        :list-item="true"
                        v-bind="{...component.propsData, mapVue}"
                    />
                </template>
            </v-list>
        </v-menu>
    </v-bottom-navigation>
</template>

<script lang="ts" src="./GwtkBottomNavigation.ts" />

<style scoped>
    .gwtk-bottom-navigation.theme--light.v-bottom-navigation .v-btn:not(.v-btn--active) {
        color: unset !important;
    }

    .gwtk-bottom-navigation {
        justify-content: space-around !important;
        align-content: center;
        border-radius: 10px 10px 0 0;
    }
</style>