<template>
    <v-menu
        v-model="display"
        :close-on-content-click="false"
        transition="scale-transition"
        offset-y
        :max-width="dialogWidth"
        :width="dialogWidth"
        :min-width="dialogWidth"
    >
        <template #activator="{ on }">
            <v-text-field
                v-bind="textFieldProps"
                :disabled="disabled"
                :label="label"
                :value="formattedDatetime"
                readonly
                outlined
                dense
                hide-details="auto"
                v-on="on"
            />
        </template>
        <v-card>
            <v-card-text class="px-0 py-0">
                <v-tabs v-model="activeTab" fixed-tabs>
                    <v-tab key="calendar">
                        <v-icon>mdi-calendar</v-icon>
                    </v-tab>
                    <v-tab key="timer" :disabled="dateSelected">
                        <v-icon>mdi-clock-outline</v-icon>
                    </v-tab>
                    <v-tab-item key="calendar">
                        <v-date-picker
                            v-model="date"
                            :width="dialogWidth"
                            v-bind="datePickerProps"
                            @input="showTimePicker"
                        />
                    </v-tab-item>
                    <v-tab-item key="timer">
                        <v-time-picker
                            ref="timer"
                            v-model="time"
                            :width="dialogWidth"
                            class="v-time-picker-custom"
                            v-bind="timePickerProps"
                        />
                    </v-tab-item>
                </v-tabs>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn color="blue darken-1" text @click="okHandler">
                    {{ okText }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-menu>
</template>

<script lang="ts" src="./GwtkDateTimePicker.ts" />

<style>
    .v-picker--time .v-picker__title {
        padding: 8px !important;
    }

    .v-time-picker-title__time .v-picker__title__btn, .v-time-picker-title__time span {
        height: 40px !important;
        font-size: 40px !important;
    }
</style>