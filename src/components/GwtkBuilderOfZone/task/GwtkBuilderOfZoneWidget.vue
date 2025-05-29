<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <v-form ref="radiusForm" class="mx-2">
            <v-row no-gutters class="pb-8">
                <v-text-field
                    v-model="textObject"
                    :rules="checkSelObj"
                    class="centered-input text--darken-3"
                    persistent-hint
                    auto-grow
                    hide-details="auto"
                    dense
                    readonly
                    @click:append-outer="toggleSelectAction"
                />
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-button
                            icon="flashlight-plus"
                            secondary
                            :selected="actionDescription && actionDescription.active"
                            class="ml-2"
                            v-bind="attrs"
                            v-on="on"
                            @click="toggleSelectAction"
                        />
                    </template>
                    <span>{{ (actionDescription && actionDescription.active)? $t('builderzone.Disable object selection') : $t('builderzone.Enable object selection') }}</span>
                </v-tooltip>
            </v-row>
            <v-row no-gutters class="pb-8">
                <v-col cols="8">
                    <v-text-field
                        v-model="radiusValue"
                        :rules="radius"
                        :label="textZoneRadius"
                        type="number"
                        min="0"
                        dont-fill-mask-blanks
                        persistent-hint
                        autocomplete="off"
                        hide-details="auto"
                        dense
                    />
                </v-col>
                <v-col cols="1" />
                <v-col cols="3">
                    <v-combobox
                        v-model="unitsStart"
                        :items="arrayUnits"
                        :item-text="'text'"
                        :item-value="'value'"
                        dense hide-details
                    />
                </v-col>
            </v-row>
        </v-form>
        <v-row no-gutters class="mx-1">
            <gwtk-checkbox
                :value="checkAroundAll"
                :label="checkboxAroundAll"
                @change="changeCheckAroundAll"
            />
        </v-row>
        <v-row no-gutters class="mx-1">
            <gwtk-checkbox
                :value="checkSewZone"
                :label="checkboxSewZone"
                :disabled="disableSewZone"
                @change="changeCheckSewZone"
            />
        </v-row>
        <v-row no-gutters class="mx-1">
            <gwtk-checkbox
                :value="checkSearchObjects"
                :label="checkboxSearchObjects"
                :disabled="searchObjectDisabled"
                @change="changeCheckSearchObjects"
            />
        </v-row>
        <v-row no-gutters class="py-4 mx-2">
            <v-text-field
                v-model="bufferZoneName"
                hide-details
                dense
            />
        </v-row>
        <v-row no-gutters class="pt-5 mx-2">
            <v-col>
                <v-tooltip bottom align="end">
                    <template #activator="{ on }">
                        <gwtk-button
                            primary
                            :title="titleButtonBuild"
                            width-available
                            v-on="on"
                            @click="startBuilderZone"
                        />
                    </template>
                    <span>{{ buildName }}</span>
                </v-tooltip>
            </v-col>
        </v-row>
        <v-overlay
            :value="searchProgressBar"
            :absolute="searchProgressBar"
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular
                    :active="searchProgressBar"
                    indeterminate
                    size="64"
                >
                    <v-btn
                        large
                        icon
                        plain
                        tile
                        @click="closeOverlay"
                    >
                        <gwtk-icon name="close-icon" />
                    </v-btn>
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-task-container-item>
</template>

<script src="./GwtkBuilderOfZoneWidget.ts" />

<style scoped>
    .theme--light .gwtk-flashlight-icon {
      background:
          linear-gradient(-45deg, transparent calc(50% - 1px), var(--v-secondary-lighten3) calc(50% - 1px), var(--v-secondary-lighten3) calc(50% + 1px), transparent calc(50% + 1px));
    }

    .theme--dark .gwtk-flashlight-icon {
      background:
          linear-gradient(-45deg, transparent calc(50% - 1px), var(--v-secondary-lighten5) calc(50% - 1px), var(--v-secondary-lighten5) calc(50% + 1px), transparent calc(50% + 1px));
    }
</style>
