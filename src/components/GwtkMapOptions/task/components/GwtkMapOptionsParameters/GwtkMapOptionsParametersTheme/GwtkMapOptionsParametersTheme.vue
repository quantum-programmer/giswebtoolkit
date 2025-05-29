<template>
    <gwtk-expansion-panel
        :title="$t('mapoptions.User interface')"
    >
        <fieldset class="pb-2">
            <v-row>
                <v-col cols="5">
                    <v-switch
                        :input-value="ui.darkThemeFlag"
                        :label="themeTitle"
                        class="mt-0 pt-0"
                        hide-details
                        @change="toggleTheme"
                    />
                </v-col>
                <v-col cols="7">
                    <v-checkbox
                        :input-value="ui.reduceSizeInterfaceFlag"
                        :label="interfaceReduceSizeTitle"
                        class="mt-0 pt-0"
                        hide-details
                        @change="toggleInterfaceSize"
                    />
                </v-col>
            </v-row>
        </fieldset>
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('mapoptions.Primary color') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="ui.primaryColor"
                        outlined
                        dense
                        hide-details
                        readonly
                    >
                        <template #append>
                            <v-menu
                                top
                                :close-on-content-click="false"
                                z-index="100"
                            >
                                <template #activator="{ on }">
                                    <div
                                        class="gwtk-test-ui-primaryColor"
                                        :style="primaryStyle"
                                        v-on="on"
                                    />
                                </template>
                                <v-card>
                                    <v-card-text class="pa-0">
                                        <v-color-picker
                                            class="gwtk-test-color-picker-ui-1"
                                            :value="ui.primaryColor"
                                            mode="hexa"
                                            hide-mode-switch
                                            @update:color="changePrimaryColor"
                                        />
                                    </v-card-text>
                                </v-card>
                            </v-menu>
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>
        </fieldset>
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('mapoptions.Secondary color') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="ui.secondaryColor"
                        outlined
                        dense
                        hide-details
                        readonly
                    >
                        <template #append>
                            <v-menu
                                top
                                :close-on-content-click="false"
                                z-index="100"
                            >
                                <template #activator="{ on }">
                                    <div
                                        class="gwtk-test-ui-secondaryColor"
                                        :style="secondaryStyle"
                                        v-on="on"
                                    />
                                </template>
                                <v-card>
                                    <v-card-text class="pa-0">
                                        <v-color-picker
                                            class="gwtk-test-color-picker-ui-2"
                                            :value="ui.secondaryColor"
                                            mode="hexa"
                                            hide-mode-switch
                                            @update:color="changeSecondaryColor"
                                        />
                                    </v-card-text>
                                </v-card>
                            </v-menu>
                        </template>
                    </v-text-field>
                </v-col>
            </v-row>
        </fieldset>
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    <v-select
                        :value="ui.fontSizeData.selectedValue"
                        :items="ui.fontSizeData.values"
                        :item-text="'text'"
                        :item-value="'size'"
                        @change="changeFontSize"
                    />
                </v-col>
            </v-row>
        </fieldset>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersTheme.ts" />