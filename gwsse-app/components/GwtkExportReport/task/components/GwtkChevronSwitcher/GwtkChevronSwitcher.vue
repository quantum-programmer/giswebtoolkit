<template>
    <v-card
        flat
    >
        <v-card-subtitle
            class="py-0"
            @click="toggle"
        >
            <div
                class="d-flex align-center"
            >
                <slot
                    name="title"
                >
                    <span class="gwtk-chevron-switcher__title" v-text="title" />
                </slot>
                <v-btn
                    class="gwtk-chevron-switcher__icon ml-1"
                    icon
                    small
                >
                    <v-icon
                        small
                    >
                        mdi-cog
                    </v-icon>
                </v-btn>
                <v-btn
                    class="gwtk-chevron-switcher__icon"
                    icon
                    small
                >
                    <v-icon
                        v-if="modelValue"
                    >
                        mdi-chevron-up
                    </v-icon>
                    <v-icon
                        v-else
                    >
                        mdi-chevron-down
                    </v-icon>
                </v-btn>
            </div>
        </v-card-subtitle>
        <v-expand-transition>
            <v-card-text
                v-show="modelValue"
                class="pb-0 pt-4"
            >
                <slot
                    name="body"
                />
            </v-card-text>
        </v-expand-transition>
    </v-card>
</template>

<script src="./GwtkChevronSwitcher.ts"></script>

<style>
.gwtk-chevron-switcher__title {
    font-size: 16px;
    cursor: default;
}

.gwtk-chevron-switcher__icon {
    margin: -2px;
}
</style>
