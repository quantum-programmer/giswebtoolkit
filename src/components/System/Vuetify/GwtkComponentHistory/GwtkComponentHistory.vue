<template>
    <div class="outer-container">
        <v-container class="outer-container">
            <v-toolbar
                class="gwtk-page-toolbar pointer"
                flat
                @click="$emit('close')"
            >
                <gwtk-icon
                    class="mr-3"
                    name="mdi-arrow-left"
                    :size="24"
                />
                <span class="text-subtitle-1">
                    {{ $t('phrases.Search history') }}
                </span>
                <v-spacer />
            </v-toolbar>
            <v-container class="gwtk-main-container">
                <v-list>
                    <v-list-item-group>
                        <template v-for="(item, index) in searchHistory">
                            <div :key="index">
                                <v-divider v-if="index === 0" />
                                <v-list-item
                                    @click="$emit('select', item.id )"
                                >
                                    <v-list-item-content>
                                        {{ item.text }}
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <gwtk-icon-button
                                            large
                                            icon="mdi-delete-outline"
                                            icon-color="--v-primary-base"
                                            @click.stop="$emit('clear', item.id )"
                                        />
                                    </v-list-item-action>
                                </v-list-item>
                                <v-divider />
                            </div>
                        </template>
                    </v-list-item-group>
                </v-list>
            </v-container>
            <v-row
                no-gutters
                class="mt-2"
            >
                <gwtk-button
                    secondary
                    width="100%"
                    :title="$t('phrases.Clear')"
                    @click="$emit('clear')"
                />
                <v-spacer />
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkComponentHistory.ts" />

<style scoped>
.gwtk-main-container {
    height: calc(100% - 96px);
    overflow-x: hidden;
    overflow-y: auto;
}

.outer-container {
    overflow-y: hidden;
    height: calc(100%);
}

.pointer {
    cursor: pointer;
}
</style>
