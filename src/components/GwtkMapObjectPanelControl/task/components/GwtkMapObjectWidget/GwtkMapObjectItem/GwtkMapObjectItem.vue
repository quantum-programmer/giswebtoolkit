<template>
    <gwtk-selectable
        :fill="selected"
    >
        <v-card
            v-blur
            class="pa-0 pr-1 mb-1 no-focus"
            :ripple="false"
            flat
            @click="$emit('mapobject:click', mapObjectContent.mapObject.guid)"
        >
            <v-row dense no-gutters justify="space-between" align="center">
                <v-col cols="auto">
                    <div class="border gwtk-picture-container">
                        <img
                            class="gwtk-picture-icon"
                            alt=""
                            :src="mapObjectContent.mapObject.mapObjectIconUrl"
                        >
                    </div>
                </v-col>
                <v-col cols="9" class="pr-3">
                    <v-list-item-title
                        class="text-subtitle-1 font-weight-bold gwtk-trimmed-string gwtk-object-title"
                    >
                        {{
                            mapObjectContent.isEmptyClusterObject ? $t('phrases.Clustered data') : mapObjectContent.objectNameBySemantic
                        }}
                    </v-list-item-title>
                    <v-list-item-subtitle
                        class="text-body-2 gwtk-trimmed-string"
                    >
                        {{ mapObjectContent.objectName }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle
                        v-if="mapObjectContent.showObjectNumber"
                        class="d-flex justify-space-between text-subtitle-2 font-weight-bold"
                    >
                        <span>
                            {{
                                mapObjectContent.isEmptyClusterObject ? $t('phrases.Cluster number') : $t('phrases.Object number')
                            }}
                        </span>
                        <span>
                            {{
                                mapObjectContent.isEmptyClusterObject ? `${mapObjectContent.objectNumber} (${clusteredObjectsCount})` : mapObjectContent.objectNumber
                            }}
                        </span>
                    </v-list-item-subtitle>
                    <v-list-item-subtitle
                        v-if="mapObjectContent.address"
                        class="text-body-2 font-weight-bold address-style"
                    >
                        <span>{{ mapObjectContent.address }}</span>
                    </v-list-item-subtitle>
                </v-col>
                <v-col
                    cols="auto"
                    :class="isReducedSizeInterface?'gwtk-button-padding-reduce':''"
                >
                    <v-row dense>
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    v-if="mapObjectContent.isEmptyClusterObject"
                                    secondary
                                    class="my-1"
                                    icon="target"
                                    :icon-size="isReducedSizeInterface?14:18"
                                    v-on="on"
                                    @click.stop="$emit('mapobject:showInMap')"
                                />
                            </template>
                            <div>{{ $t('mapcontent.Show object') }}</div>
                        </v-tooltip>
                        <v-tooltip v-if="!isShowSelectedObjects()" bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    v-if="!mapObjectContent.isEmptyClusterObject"
                                    :disabled="!mapObjectContent.mapObject.isValidGisObject"
                                    secondary
                                    class="my-1"
                                    icon="flashlight-plus"
                                    :icon-size="isReducedSizeInterface?14:18"
                                    :selected="isReallySelected"
                                    v-on="on"
                                    @click.stop="$emit('mapobject:select')"
                                />
                            </template>
                            <div>{{ isReallySelected? $t('mapobjectpanel.Remove from selected') : $t('mapobjectpanel.Add to selected') }}</div>
                        </v-tooltip>
                        <v-tooltip v-else bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    class="my-1"
                                    icon="mdi-select-remove"
                                    :icon-size="isReducedSizeInterface?14:18"
                                    v-on="on"
                                    @click.stop="$emit('mapobject:select')"
                                />
                            </template>
                            <div>{{ $t('mapobjectpanel.Remove from selected') }}</div>
                        </v-tooltip>
                    </v-row>
                    <v-row dense>
                        <v-tooltip v-if="editingMode" bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    class="mb-1"
                                    :icon="mapObjectContent.isEmptyClusterObject? 'mdi-format-list-bulleted-square' : 'mdi-square-edit-outline'"
                                    :icon-size="isReducedSizeInterface?14:18"
                                    v-on="on"
                                    @click.stop="$emit('mapobject:info')"
                                />
                            </template>
                            <div>{{ $t('phrases.Edit object') }}</div>
                        </v-tooltip>
                        <v-tooltip v-else bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    class="mb-1"
                                    :icon="mapObjectContent.isEmptyClusterObject? 'mdi-format-list-bulleted-square' : 'mdi-information-variant'"
                                    :icon-size="isReducedSizeInterface?14:18"
                                    v-on="on"
                                    @click.stop="$emit('mapobject:info')"
                                />
                            </template>
                            <div>{{ $t('phrases.Object information') }}</div>
                        </v-tooltip>
                    </v-row>
                </v-col>
            </v-row>
            <v-row dense no-gutters class="mt-1">
                <v-col cols="12">
                    <v-divider />
                </v-col>
            </v-row>
        </v-card>
    </gwtk-selectable>
</template>

<script type="ts" src="./GwtkMapObjectItem.ts" />
<style scoped>

    .gwtk-picture-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
    }

    .gwtk-picture-icon {
        min-width: 32px;
        min-height: 32px;
        max-height: 64px;
        max-width: 64px;
        object-fit: contain;
    }

    .address-style {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        direction: rtl;
        text-align: left;
    }

    .gwtk-trimmed-string {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .gwtk-object-subtitle {
        font-size: 0.75rem;
        line-height: 1rem;
    }

    .no-focus:focus:before {
        opacity: 0 !important;
    }

    .gwtk-object-title {
        min-height: 1.5rem;
        font-size: 0.875rem;
        line-height: 1.2rem;
    }
    /* .gwtk-object-title-reduce {
        min-height: 1.2rem;
        font-size: 0.875rem;
        line-height: 1.2rem;
    }

    .gwtk-object-subtitle-2 {
        font-size: 0.75rem;
        line-height: 1.2rem
    } */

    .gwtk-button-padding-reduce .px-2 {
        height:unset;
        padding-right: var(--px-2) !important;
        padding-left: var(--px-2) !important;
    }
    .gwtk-button-padding-reduce .py-2 {
        padding-top: var(--py-2)!important;
        padding-bottom: var(--py-2) !important;
    }

</style>
