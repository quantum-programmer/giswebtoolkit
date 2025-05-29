<template>
    <div class="gwtk-chart-container">
        <canvas ref="reliefChart" />
        <div v-if="showMessage" class="gwtk-chart-message">
            {{ currentMessage }}
        </div>
        <div v-if="isActivePartSelectionMode && objectContourCount > 1" class="gwtk-chart-contour-select pt-2">
            <v-col style="max-width: 15em">
                <v-tooltip top>
                    <template #activator="{ on, attrs }">
                        <v-select
                            v-model="contourSelected"
                            :items="items"
                            dense
                            :label="$t('relieflinediagram.Selecting object contour')"
                            flat
                            hide-details
                            outlined
                            v-bind="attrs"
                            v-on="on"
                        />
                    </template>
                    {{ $t('relieflinediagram.Selecting object contour') }}
                </v-tooltip>
            </v-col>
        </div>
        <div v-if="isActivePartSelectionMode" class="pt-2 gwtk-chart-message">
            <gwtk-button
                secondary
                :title="$t('relieflinediagram.Cancel')"
                @click="toggleCancel"
            />
            <gwtk-button
                class="ml-4"
                primary
                :title="$t('relieflinediagram.Build')"
                :disabled="!isBuildEnabled"
                @click="toggleBuild"
            />
        </div>
        <div v-show="isWaitingForChart" class="gwtk-chart-message">
            <v-progress-circular
                active
                indeterminate
                size="32"
            />
        </div>
    </div>
</template>

<script src="./GwtkReliefLineChart.ts" type="ts" />

<style scoped>
    .gwtk-chart-container {
        height: calc(100% - 0.1em);
    }

    .gwtk-chart-message {
        display: flex;
        justify-content: center;
    }

    .gwtk-chart-contour-select{
        display: flex;
        justify-content: center;
    }

</style>