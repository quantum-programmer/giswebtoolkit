<template>
    <gwtk-window-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="467"
        :min-width="731"
    >
        <v-col class="gwtk-measurement-item-list pt-0">
            <v-row v-if="!measurementList.length" class="text-body-1 pa-2">
                {{ $t('phrases.Please, indicate the first point on the map') }}
            </v-row>
            <v-list
                v-else
                class="py-0"
            >
                <template v-for="(item, index) in measurementList">
                    <gwtk-list-item
                        :key="index+item.name"
                        :title="$t('phrases.' + item.name)"
                        border="true"
                    >
                        <template #right-slot>
                            <v-col class="text-body-1 font-weight-bold">
                                {{ getDataValue(item.value) + ' ' + getDataValue(item.unit) }}
                            </v-col>
                        </template>
                    </gwtk-list-item>
                    <v-divider
                        v-if="index !== measurementList.length-1"
                        :key="index"
                    />
                </template>
            </v-list>
            <div class="gwtk-table-container">
                <v-simple-table
                    v-if="segmentListFiltered.length"
                    fixed-header
                    style="height: 100%"
                    height="calc(100% - 48px)"
                >
                    <thead>
                        <tr>
                            <th class="text-left text-body-1">
                                {{ $t('phrases.Segment') }}
                            </th>
                            <th
                                v-for="(item, index) in segmentListFiltered[ 0 ].data"
                                :key="index"
                                class="text-left text-body-1"
                            >
                                {{ getTitle(item) }}
                            </th>
                        </tr>
                    </thead>
                    <tbody ref="segmentTableBody">
                        <tr
                            v-for="(segment, index) in segmentListFiltered"
                            :key="index"
                            :class="{selected: segment.active}"
                            style="cursor: pointer"
                            @click.stop="toggleSegment(index)"
                        >
                            <td>{{ $t('phrases.Segment') + ' ' + (index + 1) }}</td>
                            <td
                                v-for="(item, index1) in segment.data"
                                :key="index1"
                            >
                                {{ getDataValue(item.value, item.unit) }}
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </div>
        </v-col>
        <v-row v-if="measurementList.length" class="px-4">
            <v-col>
                <gwtk-button
                    width-available
                    primary
                    :disabled="isResumeButtonDisabled"
                    :title="$t('phrases.Resume')"
                    @click="toggleResume"
                >
                    <div class="pl-2">
                        <gwtk-icon :name="'object-creation'" />
                    </div>
                </gwtk-button>
            </v-col>
            <v-col>
                <gwtk-button
                    width-available
                    secondary
                    :title="$t('phrases.New measurement')"
                    @click="toggleNewMeasurement"
                />
            </v-col>
            <v-col>
                <gwtk-button
                    :disabled="!segmentList.length"
                    width-available
                    secondary
                    :title="$t('phrases.Export to CSV')"
                    @click="toggleExport"
                />
            </v-col>
        </v-row>
    </gwtk-window-item>
</template>

<script lang="ts" src="./GwtkAreaMeasurementsSurfaceWidget.ts" />

<style scoped>
    .theme--light .selected > * {
        background: var(--v-primary-lighten3) !important;
    }

    .theme--dark .selected > * {
        background: var(--v-primary-darken3) !important;
    }

    .gwtk-measurement-item-list {
        min-height: 10em;
        height: calc(100% - 4em);
        margin-bottom: 1em;
        overflow-y: hidden;
        overflow-x: hidden;
    }

    .gwtk-table-container {
        height: calc(100% - 4em);
        overflow-y: auto;
    }
</style>