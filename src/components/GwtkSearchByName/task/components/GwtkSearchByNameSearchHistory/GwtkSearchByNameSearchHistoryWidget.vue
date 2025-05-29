<template>
    <div class="outer-container">
        <v-container class="outer-container">
            <v-toolbar
                class="gwtk-page-toolbar pointer"
                flat
                @click="onOpenHistory"
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
                        <template v-for="(item, i) in searchHistory">
                            <div :key="i">
                                <v-divider v-if="i === 0" />
                                <v-list-item
                                    :key="i"
                                    @click="selectHistory(item.id); onOpenHistory()"
                                >
                                    <v-list-item-content>
                                        {{ item.text }}
                                    </v-list-item-content>
                                    <v-list-item-action>
                                        <gwtk-icon-button
                                            large
                                            icon="mdi-delete-outline"
                                            icon-color="--v-primary-base"
                                            @click.stop="clearSearchHistory(i)"
                                        />
                                    </v-list-item-action>
                                </v-list-item>
                                <v-divider />
                            </div>
                        </template>
                    </v-list-item-group>
                </v-list>
            </v-container>
            <v-row no-gutters>
                <gwtk-button
                    secondary
                    width="100%"
                    :title="$t('phrases.Clear')"
                    @click="clearSearchHistory()"
                />
                <v-spacer />
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkSearchByNameSearchHistoryWidget.ts" />

<style scoped>
.gwtk-main-container {
    height: calc(100% - 36px - 36px - 18px);
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
