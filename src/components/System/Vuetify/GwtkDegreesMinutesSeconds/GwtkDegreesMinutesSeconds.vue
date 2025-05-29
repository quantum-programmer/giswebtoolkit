<template>
    <v-row dense no-gutters style="min-height: 38px;" align-content="center">
        <v-col cols="4">
            <v-text-field
                :value="degreesMinutesSecondsList[0]"
                class="gwtk-degrees-minutes-seconds-text-centered"
                :class="inputClass"
                :readonly="readOnly"
                :error="isError"
                type="number"
                dense
                :solo="readOnly"
                flat
                hide-details
                hide-spin-buttons
                dont-fill-mask-blanks
                suffix="°"
                @input="(value)=>setDegreesValue(value)"
            />
        </v-col>
        <v-col cols="3">
            <v-text-field
                :value="degreesMinutesSecondsList[1]"
                :rules="minutesRule"
                class="gwtk-degrees-minutes-seconds-text-centered"
                :class="inputClass"
                :readonly="readOnly"
                type="number"
                dont-fill-mask-blanks
                dense
                :solo="readOnly"
                flat
                hide-details
                hide-spin-buttons
                suffix="′"
                maxlenght="2"
                @input="(value)=>setMinutesValue(value)"
            />
        </v-col>
        <v-col>
            <v-text-field
                :value="degreesMinutesSecondsList[2]"
                class="gwtk-degrees-minutes-seconds-text-centered"
                :class="inputClass"
                :readonly="readOnly"
                :rules="minutesRule"
                type="number"
                dense
                :solo="readOnly"
                flat
                hide-details
                hide-spin-buttons
                dont-fill-mask-blanks
                suffix="″"
                @input="(value)=>setSecondsValue(value)"
            />
        </v-col>
    </v-row>
</template>

<script lang="ts" src="./GwtkDegreesMinutesSeconds.ts"></script>

<style>
    .gwtk-degrees-minutes-seconds-text-centered input {
        text-align: end;
    }

    .gwtk-degrees-minutes-seconds-text-centered .v-input__slot {
        padding: 0 !important;
    }

</style>