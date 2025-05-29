<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
    >
        <gwtk-tabs
            v-model="selectedTab"
            class="px-2"
        >
            <gwtk-tab
                key="tab_object_lists"
                :title="$t('featuresamples.Lists')"
            />
            <gwtk-tab
                key="tab_search"
                :title="$t('phrases.Search')"
            />
        </gwtk-tabs>

        <v-tabs-items
            :value="selectedTab"
        >
            <v-tab-item
                value="tab_object_lists"
                :transition="false"
            >
                <gwtk-feature-samples-list-widget
                    :set-state="setState"
                    :selected-object-count="selectedObjectCount"
                    :group-list="groupList"
                    :active-list-indices="activeListIndices"
                />
            </v-tab-item>
            <v-tab-item
                value="tab_search"
                :transition="false"
            >
                <gwtk-feature-samples-search-widget
                    :set-state="setState"
                    :search-props="searchProps"
                />
            </v-tab-item>
        </v-tabs-items>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkFeatureSamplesWidget.ts" />

<style scoped>

</style>