<template>
    <div>
        <v-row dense class="mx-2 mt-3">
            <v-col cols="auto">
                {{ bookmarksListInfo }}
            </v-col>
            <v-spacer />
            <v-col cols="auto">
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <span v-on="on">
                            <gwtk-menu
                                theme="secondary"
                                :icon="bookmarkSelectedSortType ? 'sort-ascending' : 'sort-descending'"
                                icon-size="24"
                                icon-color="var(--v-primary-base)"
                                is-dropdown
                                :close-on-content-click="true"
                            >
                                <v-list>
                                    <v-list-item
                                        v-for="(item, index) in sortTypes"
                                        :key="index"
                                        @click="setSortFilter(item)"
                                    >
                                        <v-list-item-content>
                                            <v-list-item-title>{{ item.text }}</v-list-item-title>
                                        </v-list-item-content>
                                    </v-list-item>
                                </v-list>
                            </gwtk-menu>
                        </span>
                    </template>
                    <span>{{ $t('phrases.Sorting') }}</span>
                </v-tooltip>
            </v-col>
        </v-row>
        <v-row dense class="mx-2">
            <v-spacer />
            <v-col cols="auto">
                {{ bookmarkSelectedSortTypeText }}
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" src="./GwtkProjectBookmarksSort.ts" />

<style scoped>

</style>