<template>
    <div class="main-container">
        <v-row class="align-baseline">
            <v-col class="mx-2 my-1">
                <v-switch
                    :input-value="!semanticViewFlags.showAllSemantics"
                    class="mt-0"
                    hide-details
                    hide-spin-buttons
                    dense
                    :label="$t('phrases.Filled only')"
                    @change="setShowFilledSemantics"
                />
            </v-col>
            <v-col>
                <v-switch
                    :input-value="semanticViewFlags.commonForAllObjects"
                    :disabled="!semanticViewFlags.showAllSemantics"
                    class="mt-0"
                    dense
                    hide-details
                    hide-spin-buttons
                    :label="$t('mapobjectpanel.Common for all objects')"
                    @change="setCommonForAllObjects"
                />
            </v-col>
        </v-row>
        <v-divider />
        <div class="gwtk-semantic-list px-3">
            <v-container
                v-for="semanticItem in mapObjectContent.objectAllSemanticList"
                :key="semanticItem.key"
            >
                <v-row
                    v-for="(item, index) in semanticItem.items"
                    :key="semanticItem.key+index"
                    justify="center"
                >
                    <template v-if="mapObjectContent.checkIfEditable(item.key)">
                        <v-select
                            v-if="item.isClassifierType"
                            :class="isReducedSizeInterface?'mt-3 mb-2':'my-4'"
                            :items="item.classifierItems"
                            item-value="value"
                            item-header="text"
                            :value="item.codeValue"
                            :label="item.name"
                            dense
                            :menu-props="{contentClass: 'gwtk-object-item-editor-list'}"
                            :error="item.isMandatory&&index<1&&item.codeValue===''"
                            hide-details
                            clearable
                            @change="value => mapObjectContent.setSemanticValue(item, index, value)"
                        >
                            <template #label>
                                <span :class="isReducedSizeInterface?'font-weight-medium':'font-weight-bold'">{{ item.name }}</span>
                            </template>
                        </v-select>
                        <v-text-field
                            v-else-if="item.isBimSemantic"
                            type="text"
                            :value="item.value"
                            readonly
                            clearable
                            dense
                            :error="item.isMandatory&&index<1&&item.value===''"
                            hide-details
                            :class="isReducedSizeInterface?'mt-3 mb-2':'my-4'"
                            @click:clear="mapObjectContent.setSemanticValue(item, index, '')"
                        >
                            <template #label>
                                <span :class="isReducedSizeInterface?'font-weight-medium':'font-weight-bold'">{{ item.name }}</span>
                            </template>
                            <template #append>
                                <div v-if="!item.value">
                                    <gwtk-button
                                        secondary
                                        icon="upload"
                                        icon-size="18"
                                        @click="onClickChangeBim()"
                                    />
                                </div>
                                <div
                                    v-else
                                    class="pl-2"
                                >
                                    <gwtk-button
                                        secondary
                                        icon="visibility-on"
                                        icon-size="18"
                                        @click="onClickViewBimFile(item)"
                                    />
                                    <gwtk-button
                                        secondary
                                        icon="mdi-pencil-outline"
                                        icon-size="18"
                                        @click="onClickChangeBim()"
                                    />
                                    <!-- <gwtk-button
                                    secondary
                                    icon="mdi-close"
                                    icon-size="18"
                                    @click="value => mapObjectContent.setSemanticValue(item, index, '')"
                                /> -->
                                </div>
                                <v-file-input
                                    id="bim-file-input"
                                    style="display: none;"
                                    accept=".ifc"
                                    @change="file => openBimFileUpload(file, item)"
                                />
                            </template>
                        </v-text-field>
                        <v-text-field
                            v-else-if="item.isDownloadFile"
                            type="text"
                            :value="item.value"
                            :disabled="!mapObjectContent.checkIfEditable(item.key)"
                            dense
                            :error="item.isMandatory&&index<1&&item.value===''"
                            hide-details
                            :class="isReducedSizeInterface?'mt-3 mb-2':'my-4'"
                            clearable
                            @input="value => mapObjectContent.setSemanticValue(item, index, value)"
                        >
                            <template #label>
                                <span :class="isReducedSizeInterface?'font-weight-medium':'font-weight-bold'">{{ item.name }}</span>
                            </template>
                            <template #append-outer>
                                <gwtk-button
                                    secondary
                                    icon="upload"
                                    icon-size="18"
                                    @click="openFileUpload(item)"
                                />
                            </template>
                        </v-text-field>
                        <v-menu
                            v-else-if="item.isDateType"
                            :value="checkIfMenuIsOpened(''+item.key+index)"
                            :close-on-content-click="false"
                            :nudge-right="40"
                            transition="scale-transition"
                            offset-y
                            min-width="auto"
                        >
                            <template #activator="{ on, attrs }">
                                <v-text-field
                                    :value="item.value"
                                    :disabled="!mapObjectContent.checkIfEditable(item.key)"
                                    dense
                                    prepend-icon="mdi-calendar"
                                    :error="item.isMandatory&&index<1&&item.value===''"
                                    hide-details
                                    :class="isReducedSizeInterface?'mt-3 mb-2':'my-4'"
                                    clearable
                                    readonly
                                    v-bind="attrs"
                                    @click="addMenu(''+item.key+index)"
                                    v-on="on"
                                >
                                    <template #label>
                                        <span :class="isReducedSizeInterface?'font-weight-medium':'font-weight-bold'">{{ item.name }}</span>
                                    </template>
                                </v-text-field>
                            </template>
                            <v-date-picker
                                :value="parseDate(item.value)"
                                :locale="locale"
                                @input="(value) => { mapObjectContent.setSemanticValue(item, index, formatDatePickerValue(value)); resetMenu(''+item.key+index); }"
                            />
                        </v-menu>
                        <v-text-field
                            v-else
                            :type="item.isNumericType ? 'number' : 'text'"
                            :value="item.value"
                            :max="item.maximum"
                            :min="item.minimum"
                            :disabled="!mapObjectContent.checkIfEditable(item.key)"
                            dense
                            :error="item.isMandatory&&index<1&&item.value===''"
                            hide-details
                            :class="isReducedSizeInterface?'mt-3 mb-2':'my-4'"
                            clearable
                            @input="value => mapObjectContent.setSemanticValue(item, index, value)"
                        >
                            <template #label>
                                <span :class="isReducedSizeInterface?'font-weight-medium':'font-weight-bold'">{{ item.name }}</span>
                            </template>
                        </v-text-field>
                    </template>
                </v-row>
            </v-container>
        </div>
    </div>
</template>

<script lang="ts" src="./GwtkMapObjectItemSemanticEditor.ts" />

<style scoped>
    .main-container {
        height: 100%;
    }

    .gwtk-semantic-list {
        max-height: calc(100% - 50px);
        overflow-y: auto;
        overflow-x: hidden;
    }
</style>
