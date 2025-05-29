<template>
    <gwtk-list-item
        v-if="listItem"
        :title="name"
        :icon="icon"
        icon-size="22"
        :href="linkObject.href"
        :target="linkObject.target"
        :selected="selected!==false"
        :disabled="disabled!==false"
        v-bind="$attrs"
        v-on="$listeners"
    />
    <v-btn
        v-else
        v-blur
        plain
        :ripple="false"
        class="gwtk-nav-button px-0"
        :selected="selected"
        :disabled="disabled"
        :href="linkObject.href"
        :target="linkObject.target"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <div class="d-flex flex-wrap flex-column align-center gwtk-nav-button-content">
            <gwtk-icon
                :name="icon"
                :size="20"
                :color="selected? 'var(--v-primary-base)':''"
            />
            <div
                class="text-caption gwtk-nav-button-text"
                :style="{color: selected? 'var(--v-primary-base)':''}"
            >
                {{ name }}
            </div>
        </div>
    </v-btn>
</template>

<script lang="ts" src="./GwtkNavButton.ts"></script>

<style scoped>
    .gwtk-nav-button:not(.gwtk-button) {
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
    }

    .gwtk-nav-button.v-btn--disabled {
        opacity: 0.33;
    }

    .gwtk-nav-button-text.text-caption {
        line-height: unset;
        max-width: 21vw;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>