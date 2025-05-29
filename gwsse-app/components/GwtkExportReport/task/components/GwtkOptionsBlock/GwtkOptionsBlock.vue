<template>
    <v-card
        flat
        :class="chevronValue ? 'pt-1 mb-3' : 'my-3'"
        :style="chevronValue ? 'margin-top: -4px;' : ''"
    >
        <gwtk-chevron-switcher
            @toggle="chevronValue = $event"
        >
            <template
                #title
            >
                <div
                    class="d-flex align-center"
                >
                    <gwtk-checkbox
                        :value="show"
                        :label="label"
                        :disabled="disabled"
                        :rules="rules"
                        class="my-0"
                        dense
                        @click.stop
                        @change="setShow"
                    />

                    <v-progress-circular
                        v-if="loading"
                        class="ml-4"
                        size="24"
                        indeterminate
                    />
                </div>
            </template>

            <template
                #body
            >
                <div
                    v-if="errorMessage"
                    class="pl-12 attributes-error"
                >
                    {{ errorMessage }}
                </div>

                <slot />
            </template>
        </gwtk-chevron-switcher>
    </v-card>
</template>

<script src="./GwtkOptionsBlock.ts"></script>