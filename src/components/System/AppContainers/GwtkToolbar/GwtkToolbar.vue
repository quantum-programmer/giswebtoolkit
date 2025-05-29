<template>
    <div>
        <v-row
            class="flex-nowrap"
            justify="end"
            align-content="center"
        >
            <v-col
                v-for="(group, index) in groupComponents.mapGroups"
                :key="index"
                cols="auto"
            >
                <v-toolbar
                    class="gwtk-toolbar"
                    floating
                    height="auto"
                    rounded
                    elevation="0"
                    color="transparent"
                >
                    <template v-for="(groupComponent, groupComponentIndex) in group">
                        <component
                            :is="groupComponent.name"
                            v-if="groupComponent"
                            :key="groupComponentIndex"
                            v-bind="{...groupComponent.propsData, mapVue}"
                        />
                    </template>
                </v-toolbar>
            </v-col>
            <v-col cols="auto" class="pl-0">
                <v-toolbar
                    class="gwtk-toolbar"
                    floating
                    height="auto"
                    rounded
                    elevation="0"
                    color="transparent"
                >
                    <gwtk-menu
                        v-if="groupComponents.listGroups.length>0"
                        bottom
                        offset-y
                        max-height="90%"
                        max-width="298"
                        min-width="298"
                    >
                        <template #trigger="{ on, attrs, value }">
                            <gwtk-tool-button
                                icon="mdi-menu"
                                :tooltip-text="$t('phrases.Other')"
                                :selected="value"
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <v-list
                            class="gwtk-detail-list px-0"
                        >
                            <template v-for="(group, index) in groupComponents.listGroups">
                                <component
                                    :is="component.name"
                                    v-for="(component, componentIndex) in group"
                                    :key="index+''+componentIndex"
                                    :list-item="true"
                                    v-bind="{...component.propsData, mapVue}"
                                />
                                <v-divider
                                    v-if="index !== groupComponents.listGroups.length - 1"
                                    :key="index"
                                />
                            </template>
                        </v-list>
                    </gwtk-menu>
                </v-toolbar>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" src="./GwtkToolbar.ts" />

<style scoped>
    .gwtk-detail-list {
        max-height: 83.33vh;
        overflow-y: auto
    }

</style>

<style>
    .gwtk-toolbar .v-toolbar__content {
        padding: 0;
    }
</style>
