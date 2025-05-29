<template>
    <v-checkbox
        hide-details="auto"
        class="gwtk-checkbox"
        :input-value="value"
        v-bind="$attrs"
        v-on="$listeners"
        @change="updateModelValue"
    >
        <template #label>
            <span class="d-flex gwtk-checkbox-slot">
                <slot v-if="!$attrs.label" class="gwtk-checkbox-slot" />
                <template v-else>{{ $attrs.label }}</template>
            </span>
        </template>
    </v-checkbox>
</template>

<script lang="ts" src="./GwtkCheckbox.ts"></script>

<style scoped>

    .gwtk-checkbox {
        margin-top: 0;
        padding-top: 0;
    }

    .gwtk-checkbox-slot {
        align-items: center;
        width: 100%;
    }

    .v-input--is-disabled .gwtk-checkbox-slot {
        color: unset;
    }

    .v-input--is-label-active .gwtk-checkbox-slot {
        color: var(--v-primary-base);
    }

    .gwtk-checkbox .theme--light.v-label--is-disabled {
        color: var(--v-secondary-lighten4);
    }

    .theme--light.v-input--selection-controls.v-input--is-disabled .v-icon {
        color: var(--v-secondary-lighten5) !important;
    }

</style>