<template>
    <gwtk-matrix-control-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        class="gwtk-matrix-control-container-item"
    >
        <div
            v-if="isWaiting"
            class="pt-16 text-center"
        >
            <v-progress-circular
                indeterminate
                size="64"
            />
        </div>
        <v-container v-else>
            <v-list v-if="serviceMatrixList.length">
                <gwtk-list-item
                    v-for="(serviceMatrixItem, num) in serviceMatrixList"
                    :key="num"
                    bordered
                    class="mb-2"
                >
                    <v-list>
                        <gwtk-list-item
                            v-for="(matrixItem, index) in serviceMatrixItem.matrixItems"
                            :key="index"
                            :title="matrixItem.name"
                        >
                            <template #right-slot>
                                <v-col class="text-body-1 font-weight-bold">
                                    {{ matrixItem.value? matrixItem.value + ' ' + matrixItem.unit : '-' }}
                                </v-col>
                            </template>
                        </gwtk-list-item>
                    </v-list>
                </gwtk-list-item>
            </v-list>
            <div
                v-else
                class="mx-2"
            >
                {{ errorMessage }}
            </div>
        </v-container>
    </gwtk-matrix-control-container-item>
</template>

<script lang="ts" src="./GwtkMatrixControlWidget.ts" />

<style scoped>

</style>
