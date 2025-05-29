<template>
    <v-container class="pa-1 container-object">
        <v-container
            class="pa-0"
            style="height: 100%;"
            fluid
        >
            <v-virtual-scroll
                v-if="recordsList.length > 0 && updateOverlay === false"
                :items="recordsList"
                item-height="48px"
                class="gwtk-beekeeper-static-object-virtual_scroll"
            >
                <template #default="{ item }">
                    <gwtk-beekeeper-static-record-item
                        :key="getRecordId(item)"
                        :record="item"
                        :selected="isSelected(item)"
                        style="width: 100%; overflow: hidden"
                        @permanentApiary:select="selectRecordAndShowInMap"
                        @permanentApiary:edit="openEditForm"
                    />
                </template>
            </v-virtual-scroll>
            <v-col
                v-if="recordsList.length === 0 && updateOverlay === false"
            >
                {{ $t('phrases.No items found') }}
            </v-col>
        </v-container>
    </v-container>
</template>

<script lang="ts" src="./GwtkBeekeeperStaticRecordsListWidget.ts" />
<style scoped>
    .container-object {
        height: 100%;
        overflow-y: hidden;
    }
    .gwtk-beekeeper-static-object-virtual_scroll {
        height: 100%;
    }
</style>