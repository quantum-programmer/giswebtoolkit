<template>
    <v-container class="gwtk-main-view px-2">
        <v-row>
            <v-col>
                <span class="text-subtitle-1">
                    {{ $t('mapeditor.Create object') }}
                </span>
            </v-col>
        </v-row>
        <v-row>
            <v-col class="py-2">
                <v-text-field
                    :label="$t('mapeditor.Map name')"
                    :value="publishObject.mapName"
                    outlined
                    dense
                    hide-details
                    readonly
                />
            </v-col>
        </v-row>
        <v-row>
            <v-col class="py-2">
                <v-autocomplete
                    :label="$t('mapeditor.Coordinate system')"
                    :items="crsItems"
                    :value="crsItems[0]"
                    item-text="title"
                    item-value="epsg"
                    dense
                    flat
                    outlined
                    hide-details
                    clearable
                    @change="changePublishObjectCrs"
                >
                    <template #item="{ item }">
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <div class="v-list-item__content">
                                    <div class="v-list-item__title" v-on="on">
                                        {{ item.title }}
                                    </div>
                                </div>
                            </template>
                            <div>{{ item.comment }}</div>
                        </v-tooltip>
                    </template>
                </v-autocomplete>
            </v-col>
        </v-row>
        <v-row
            justify="space-around"
            class="gwtk-publish-object-execute py-2"
        >
            <gwtk-button
                primary
                width="35%"
                :title="$t('mapeditor.Execute')"
                :disabled="!publishObject.crsList.list.length"
                @click="applyUpload"
            />
            <gwtk-button
                secondary
                width="35%"
                :title="$t('mapeditor.Cancel')"
                @click="cancelUpload"
            />
        </v-row>
    </v-container>
</template>

<script lang="ts" src="./GwtkMapEditorObjectPublish.ts" />

<style scoped>
.gwtk-publish-object-execute {
    margin: 0.6em 0;
    display: flex;
    justify-content: space-between;
    align-content: flex-end;
}

.gwtk-main-view {
    min-height: 440px;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>