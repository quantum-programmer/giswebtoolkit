<template>
    <v-row justify="space-between" class="mt-n4 mb-n4">
        <v-col class="ml-2">
            <v-tooltip
                v-for="item in buttonViewActions"
                :key="item.value"
                bottom
            >
                <template #activator="{ on }">
                    <gwtk-icon-button
                        class="ma-2"
                        :icon="item.image"
                        :selected="isSelectedMode(item.value)"
                        v-on="on"
                        @click="changeMode(item.value)"
                    />
                </template>
                <div>{{ item.text }}</div>
            </v-tooltip>
        </v-col>
        <v-col cols="auto" class="mr-2">
            <v-menu offset-y>
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
                <v-list class="gwtk-menu-content">
                    <!--                    <gwtk-list-item-->
                    <!--                        :title="$t('legend.Enable all')"-->
                    <!--                        @click="enableAll"-->
                    <!--                    />-->
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-list-item
                                :title="$t('legend.Disable all')"
                                v-on="on"
                                @click="disableAll"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Disable visibility checkbox for all layers') }}</div>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-list-item
                                :title="$t('phrases.Show all')"
                                v-on="on"
                                @click="showAll"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Enable visibility checkboxes for root nodes') }}</div>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-list-item
                                :title="$t('phrases.Hide all')"
                                v-on="on"
                                @click="hideAll"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Disable visibility checkbox for root nodes') }}</div>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-list-item
                                :title="$t('phrases.Reset all')"
                                v-on="on"
                                @click="restoreAll"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Restore visibility of layers to original state set by administrator') }}</div>
                    </v-tooltip>
                </v-list>
            </v-menu>
        </v-col>
    </v-row>
</template>


<script src="./GwtkMapContentVisibleControl.ts" lang="ts" />
