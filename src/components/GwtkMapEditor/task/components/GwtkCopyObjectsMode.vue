<template>
    <div>
        <div class="my-1">
            {{ $t('mapeditor.Number of selected objects') + ': ' + copyActionInfo.selectedObjectsCount }}
        </div>
        <div v-if="copyActionInfo.selectedObjectsCount" class="my-1">
            {{ $t('mapeditor.Number of objects available for copying') + ': ' + copyActionInfo.objectsCount }}
        </div>
        <template v-if="copyActionInfo.currentObject">
            <div class="my-1">
                {{ $t('mapeditor.Copy on layer') + ': ' + layerNameForCopy }}
            </div>
            <div v-if="copyActionInfo.deleteOriginalObjectFlag" class="my-1">
                {{ $t('mapeditor.Original objects will be deleted') }}
            </div>
            <div
                v-if="!copyActionInfo.isSourceTargetSchemasEqual"
                class="my-1 warning"
            >
                {{ $t('mapeditor.Objects after copying may differ') }}
            </div>
            <v-container class="border rounded">
                <v-row no-gutters>
                    <v-col cols="3">
                        {{ $t('phrases.Code') + ': ' }}
                    </v-col>
                    <v-col class="gwtk-trimmed-string">
                        {{ copyActionInfo.currentObject.code || defaultValue }}
                    </v-col>
                </v-row>
                <v-row no-gutters>
                    <v-col cols="3">
                        {{ $t('mapeditor.Number') + ': ' }}
                    </v-col>
                    <v-col class="gwtk-trimmed-string">
                        {{ copyActionInfo.currentObject.objectNumber || defaultValue }}
                    </v-col>
                </v-row>
                <v-row v-if="copyActionInfo.currentObject.objectNameBySemantic" no-gutters>
                    <v-col cols="3">
                        {{ $t('mapeditor.Name') + ': ' }}
                    </v-col>
                    <v-col class="gwtk-trimmed-string">
                        {{ copyActionInfo.currentObject.objectNameBySemantic }}
                    </v-col>
                </v-row>
                <v-row no-gutters>
                    <v-col cols="3">
                        {{ $t('phrases.Object') + ': ' }}
                    </v-col>
                    <v-col class="gwtk-trimmed-string">
                        {{ copyActionInfo.currentObject.layerName || defaultValue }}
                    </v-col>
                </v-row>
                <v-row no-gutters>
                    <v-col cols="3">
                        {{ $t('phrases.Type') + ': ' }}
                    </v-col>
                    <v-col class="gwtk-trimmed-string">
                        {{ objectType }}
                    </v-col>
                </v-row>
                <v-row no-gutters>
                    <v-col cols="3">
                        {{ $t('phrases.Layer') + ': ' }}
                    </v-col>
                    <v-col class="gwtk-trimmed-string">
                        {{ layerNameOriginal }}
                    </v-col>
                </v-row>
            </v-container>
            <v-row class="my-2 mx-1 justify-space-around">
                <gwtk-button
                    primary
                    :disabled="!copyActionInfo.objectsCount"
                    :title="$t('mapeditor.Yes')"
                    @click="toggleCopyObjectOperation(0)"
                />
                <gwtk-button
                    secondary
                    :disabled="!copyActionInfo.objectsCount"
                    :title="$t('mapeditor.Skip')"
                    @click="toggleCopyObjectOperation(1)"
                />
                <gwtk-button
                    secondary
                    :disabled="!copyActionInfo.objectsCount"
                    :title="$t('mapeditor.All')"
                    @click="toggleCopyObjectOperation(2)"
                />
                <gwtk-button
                    secondary
                    :title="$t('mapeditor.Finish')"
                    @click="toggleCopyObjectOperation(3)"
                />
            </v-row>
        </template>
        <template v-else-if="copyActionInfo.selectedObjectsCount">
            <gwtk-checkbox
                class="my-1"
                dense
                :value="copyActionInfo.deleteOriginalObjectFlag"
                :disabled="!copyActionInfo.isDeleteOriginalObjectEnabled"
                :label="$t('mapeditor.Delete original objects')"
                @change="toggleDeleteOriginalObjects"
            />
            <div class="my-1">
                {{ $t('mapeditor.Copy on layer') + ':' }}
            </div>
            <v-select
                dense
                hide-details
                outlined
                :value="copyActionInfo.selectedLayerXId"
                :items="layerItems"
                item-value="id"
                @change="selectLayerForCopy"
            />
            <v-row class="my-2 justify-space-around">
                <gwtk-button
                    primary
                    :disabled="copyActionInfo.objectsCount===0"
                    :title="$t('mapeditor.Execute')"
                    @click="toggleExecute"
                />
                <gwtk-button
                    secondary
                    :title="$t('mapeditor.Cancel')"
                    @click="toggleCancel"
                />
            </v-row>
        </template>
    </div>
</template>

<script lang="ts" src="./GwtkCopyObjectsMode.ts"></script>

<style scoped>
    .gwtk-trimmed-string {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>