<template>
    <v-row justify="space-between">
        <v-col>
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-icon-button
                        class="ma-2"
                        icon="mdi-file-tree"
                        :selected="isTreeMode"
                        v-on="on"
                        @click="setTreeMode"
                    />
                </template>
                <div>{{ $t('legend.Tree') }}</div>
            </v-tooltip>
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-icon-button
                        class="ma-2"
                        icon="mdi-format-list-group"
                        :selected="isGroupMode"
                        v-on="on"
                        @click="setGroupMode"
                    />
                </template>
                <div>{{ $t('legend.By group') }}</div>
            </v-tooltip>
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <gwtk-icon-button
                        class="ma-2"
                        icon="mdi-format-list-bulleted"
                        :selected="isListMode"
                        v-on="on"
                        @click="setListMode"
                    />
                </template>
                <div>{{ $t('legend.List') }}</div>
            </v-tooltip>
        </v-col>
        <v-col
            class="gwtk-legend-toolbar-append"
        >
            <v-menu
                v-if="menuItems.length"
                offset-y
            >
                <template #activator="{ on: menu, attrs }">
                    <v-tooltip bottom>
                        <template #activator="{ on: tooltip }">
                            <gwtk-icon-button
                                class="ma-2"
                                icon="dots"
                                v-bind="attrs"
                                v-on="{ ...tooltip, ...menu }"
                            />
                        </template>
                        <div>{{ $t('legend.Additionally') }}</div>
                    </v-tooltip>
                </template>
                <v-list>
                    <v-list-item
                        v-for="(item, index) in menuItems"
                        :key="index"
                        @click="toggleMenuItem(item.value)"
                    >
                        {{ item.text }}
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-col>
    </v-row>
</template>

<script lang="ts" src="./GwtkMapLegendToolbar.ts" />

<style scoped>
    .gwtk-legend-toolbar-append {
        display: flex;
        justify-content: flex-end;
    }
</style>
