<template>
    <v-container class="pa-0">
        <v-container class="pa-1">
            <v-row dense>
                <v-col class="pl-2">
                    {{ $t('beekeeper.Full name of the owner of the apiary') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-textarea
                        :value="getRecordFieldValue('fio')"
                        :readonly="true"
                        auto-grow
                        outlined
                        dense
                        hide-details="auto"
                        rows="1"
                    />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col class="pl-2">
                    {{ $t('beekeeper.Beekeeper status') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-textarea
                        :value="getRecordFieldValue('stat')"
                        :readonly="true"
                        auto-grow
                        outlined
                        dense
                        hide-details="auto"
                        rows="1"
                    />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col class="pl-2">
                    {{ $t('beekeeper.Type of apiary') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-textarea
                        :value="$t('beekeeper.permanent')"
                        :readonly="true"
                        auto-grow
                        outlined
                        dense
                        hide-details="auto"
                        rows="1"
                    />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col class="pl-2">
                    {{ $t('beekeeper.The number of the veterinary passport for the apiary') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="getRecordFieldValue('passport')"
                        :type="'text'"
                        outlined
                        dense
                        hide-details="auto"
                        @input=" (value) => setValue('passport', value) "
                    />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col class="pl-2">
                    {{ $t('beekeeper.Apiary address') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-textarea
                        :value="getRecordFieldValue('a_full')"
                        :readonly="true"
                        auto-grow
                        outlined
                        dense
                        hide-details="auto"
                        rows="1"
                    />
                </v-col>
            </v-row>
            <v-row dense>
                <v-col class="pl-2">
                    {{ $t('beekeeper.Number of bee colonies') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="getRecordFieldValue('family_count')"
                        :type="'number'"
                        min="0"
                        outlined
                        dense
                        hide-details="auto"
                        @input=" (value) => setValue('family_count', value) "
                    />
                </v-col>
            </v-row>
        </v-container>
        <v-container :align="'center'">
            <v-layout justify-center>
                <gwtk-button
                    primary
                    :title="$t('phrases.Save')"
                    class="mt-1"
                    @click="save"
                />
                <gwtk-button
                    secondary
                    :title="$t('phrases.Cancel')"
                    class="mt-1 ml-4"
                    @click="close"
                />
            </v-layout>
            <v-overlay
                :value="showSaveOverlay"
                absolute
                z-index="100"
            >
                <v-row no-gutters dense align="center" justify="center">
                    <v-progress-circular active indeterminate size="64" />
                </v-row>
            </v-overlay>
        </v-container>
    </v-container>
</template>

<script lang="ts" src="./GwtkBeekeeperStaticRecordEditForm.ts" />

<style scoped>

</style>