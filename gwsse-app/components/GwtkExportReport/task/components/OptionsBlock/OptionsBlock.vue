<template>
    <v-card
        :flat="!show"
        :class="show ? 'pt-1 mb-3' : 'my-3'"
        :style="show ? 'margin-top: -4px;' : ''"
    >
        <v-card-subtitle
            class="py-0"
        >
            <gwtk-checkbox
                :value="show"
                :label="label"
                dense
                class="mt-0 mb-2"
                :rules="rules"
                @change="setShow"
            />
        </v-card-subtitle>
        <v-expand-transition>
            <v-card
                v-show="show"
                flat
            >
                <v-card-text
                    class="pb-0"
                >
                    <slot />
                </v-card-text>
            </v-card>
        </v-expand-transition>
    </v-card>
</template>

<script src="./OptionsBlock.ts"></script>