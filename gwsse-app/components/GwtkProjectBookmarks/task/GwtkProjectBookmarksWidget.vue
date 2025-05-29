<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :options="{title:$t('phrases.Map Marks')}"
        :map-vue="mapVue"
        min-height="500"
        class="gwtkprojectbookmarks"
    >
        <gwtk-project-bookmark-add
            v-if="isAuth"
            :set-state="setState"
            :bookmarks-total="bookmarksTotal"
            :map-vue="mapVue"
        />
        <gwtk-project-bookmarks-sort
            :set-state="setState"
            :bookmarks-list="bookmarksList"
            :bookmarks-total="bookmarksTotal"
            :selected-sort-type="selectedSortType"
            :sort-types="sortTypes"
            :map-vue="mapVue"
        />
        <gwtk-project-bookmark-search
            :set-state="setState"
            :search-value="searchValue"
            :map-vue="mapVue"
        />
        <div
            class="mx-2 mt-2"
            :style="{height: bookmarksListViewModeHeight}"
        >
            <gwtk-project-bookmarks-list
                :set-state="setState"
                :bookmarks-list="bookmarksList"
                :bookmarks-total="bookmarksTotal"
                :is-auth="isAuth"
                :map-vue="mapVue"
            />
        </div>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkProjectBookmarksWidget.ts" />

<style scoped>

</style>