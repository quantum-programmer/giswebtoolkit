<template>
    <gwtk-window-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="340"
        :min-width="392"
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
        </v-col>
        <v-row v-if="measurementList.length" class="px-4">
            <v-col>
                <gwtk-button
                    primary
                    :title="$t('phrases.New measurement')"
                    width-available
                    @click="toggleNewMeasurement"
                />
            </v-col>
        </v-row>
    </gwtk-window-item>
</template>

<script lang="ts" src="./GwtkLinearMeasurementsWidget.ts" />

<style scoped>
    .gwtk-measurement-item-list {
        min-height: 11em;
        height: calc(100% - 4.9em);
        margin-bottom: 1.5em;
    }
</style>