<template>
    <v-menu
        content-class="gwtk-menu gwtk-scroll-style-wrapper"
        offset-y
        :nudge-bottom="4"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <template #activator="{ on, attrs, value }">
            <template v-if="isInnerTrigger">
                <gwtk-button
                    v-if="theme==='primary'"
                    primary
                    v-bind="attrs"
                    :icon="icon"
                    :icon-size="iconSize"
                    :icon-color="iconColor"
                    :title="title"
                    :width-available="widthAvailable!==false"
                    :disabled="disabled!==false"
                    :selected="value"
                    v-on="on"
                >
                    <gwtk-icon
                        v-if="isDropdown!==false"
                        class="ml-2"
                        :name="value?'dropdown-arrow-up':'dropdown-arrow'"
                        size="14"
                    />
                </gwtk-button>
                <gwtk-button
                    v-else-if="theme==='secondary'"
                    secondary
                    v-bind="attrs"
                    :icon="icon"
                    :icon-size="iconSize"
                    :icon-color="iconColor"
                    :title="title"
                    :width-available="widthAvailable!==false"
                    :disabled="disabled!==false"
                    :selected="value"
                    v-on="on"
                >
                    <gwtk-icon
                        v-if="isDropdown!==false"
                        class="ml-2"
                        :name="value?'dropdown-arrow-up':'dropdown-arrow'"
                        size="14"
                    />
                </gwtk-button>
                <gwtk-icon-button
                    v-else-if="theme==='clean'"
                    v-bind="attrs"
                    :icon="icon"
                    :icon-size="iconSize"
                    :icon-color="iconColor"
                    :width-available="widthAvailable!==false"
                    :disabled="disabled!==false"
                    :selected="value"
                    v-on="on"
                />
            </template>
            <slot v-else name="trigger" v-bind="{ on, attrs, value }" />
        </template>

        <div class="gwtk-menu-content">
            <slot />
        </div>
    </v-menu>
</template>

<script lang="ts" src="./GwtkMenu.ts"></script>

<style scoped>

    .gwtk-menu {
        overflow-y: hidden;
    }

    .gwtk-menu-content {
        max-height: inherit;
        overflow-y: auto;
    }
</style>