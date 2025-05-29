<template>
    <draggable
        :list="draggableIdList"
        handle=".gwtk-map-content-handle"
        class="gwtk-scrollable-container gwtk-map-content-order"
        @start="dragStart"
        @end="dragEnd"
        @update="updateOrder"
        @change="change"
    >
        <gwtk-list-item
            v-for="(item, index) in listItems"
            :key="index"
            :title-class="item.disabled? 'text--disabled' : ''"
            bordered
            :title="item.text"
            class="my-2"
        >
            <template #right-slot>
                <v-row
                    align="center"
                >
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="getLayerVisibility(item.id)?'visibility-on':'visibility-off'"
                                clean
                                :icon-color="!getLayerVisibility(item.id)?' var(--v-primary-lighten1)':' var(--v-primary-base)'"
                                :icon-size="18"
                                v-on="on"
                                @click="toggleLayerVisibility(item)"
                            />
                        </template>
                        <div>{{ getLayerVisibility(item.id) ? $t('phrases.Visible') : $t('mapcontent.Contains no visible layers') }}</div>
                    </v-tooltip>
                    <v-col class="mr-0">
                        <gwtk-map-content-item-menu-widget
                            :map-vue="mapVue"
                            :set-state="setState"
                            :content-tree-item="item"
                            :dynamic-label-data="dynamicLabelData"
                            :is-user-logged="isUserLogged"
                            :user-login="userLogin"
                            :menu-list-items="menuListItems"
                        />
                    </v-col>
                </v-row>
            </template>
            <template #left-slot>
                <v-row
                    align="center"
                    class="ml-0"
                >
                    <v-tooltip right>
                        <template #activator="{ on, attrs }">
                            <gwtk-icon-button
                                class="gwtk-map-content-handle mr-1"
                                icon="math-equal"
                                icon-size="18"
                                v-bind="attrs"
                                v-on="on"
                            />
                        </template>
                        <span>{{ $t('mapcontent.Move') }}</span>
                    </v-tooltip>
                </v-row>
            </template>
        </gwtk-list-item>
    </draggable>
</template>

<script src="./GwtkMapContentOrder.ts" lang="ts" />

<style scoped>
.gwtk-scrollable-container {
    height: 100%;
    overflow-y: auto;
    }
</style>
