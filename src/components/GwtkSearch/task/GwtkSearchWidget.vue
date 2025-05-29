<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <v-container class="pa-2 gwtk-search-widget">
            <v-row class="ma-0">
                <v-text-field
                    hide-details
                    :label="$t('phrases.Search')"
                    :value="searchText"
                    dense
                    outlined
                    clearable
                    @input="onInput"
                    @click:prepend-inner="search"
                    @keyup.enter="search"
                >
                    <template #append>
                        <div class="v-input__icon align-center">
                            <gwtk-icon-button
                                icon="search"
                                @click="search"
                            />
                        </div>
                    </template>
                </v-text-field>
            </v-row>
            <v-row class="mx-0">
                <v-col cols="auto" align-self="center">
                    <span class="text-body-1">{{ $t('phrases.Get point coordinates') + ':' }}</span>
                </v-col>
                <v-spacer />
                <v-col cols="auto">
                    <v-tooltip right>
                        <template #activator="{ on, attrs }">
                            <gwtk-button
                                small
                                secondary
                                :selected="actionDescription.active"
                                icon="moving-to-point"
                                v-bind="attrs"
                                v-on="on"
                                @click="setPickPointAction"
                            />
                        </template>
                        <span>{{ $t('phrases.Get point coordinates') }}</span>
                    </v-tooltip>
                </v-col>
            </v-row>
            <v-row class="mx-0">
                <v-divider class="my-1" />
            </v-row>
            <v-container>
                <v-radio-group
                    :value="searchSourceDescription.activeSearchModeId"
                    hide-details
                    column
                    mandatory
                    @change="onChangeSearchMode"
                >
                    <v-radio
                        v-for="searchItem in searchSourceDescription.searchModes"
                        :key="searchItem.id"
                        :label="$t(searchItem.text)"
                        :value="searchItem.id"
                    />
                </v-radio-group>
                <v-container class="pl-0">
                    <gwtk-checkbox
                        v-if="searchSourceDescription.isMapSearch"
                        :value="visibleOnCurrentScale"
                        :label="$t('phrases.Search only visible objects')"
                        @click="changeVisibleOnCurrentScale"
                    />
                    <v-combobox
                        v-if="searchSourceDescription.isAddressSearch"
                        v-model="activeAddressService"
                        :items="searchSourceDescription.addressSearchServices"
                        :item-text="'text'"
                        :item-value="'id'"
                        outlined
                        dense
                        hide-details
                    />
                </v-container>
            </v-container>
        </v-container>
        <v-overlay
            :value="searchProgressBar"
            :absolute="searchProgressBar"
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular
                    :active="searchProgressBar"
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="closeOverlay"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-task-container-item>
</template>


<script src="./GwtkSearchWiget.ts" />
<style scoped>

.v-btn:not(.v-btn--round).v-size--small {
    min-width: 28px;
    width: 28px;
}
</style>