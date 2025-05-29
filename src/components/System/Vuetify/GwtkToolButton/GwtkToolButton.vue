<template>
    <div :class="`gwtk-test-tool-${icon}`">
        <gwtk-list-item
            v-if="listItem"
            :title="tooltipText"
            :icon="icon"
            :icon-size="iconSize"
            :href="linkObject.href"
            :target="linkObject.target"
            :selected="selected!==false"
            :disabled="disabled!==false"
            :ripple="false"
            v-bind="$attrs"
            v-on="$listeners"
        />
        <gwtk-tooltip
            v-else
            :text="tooltipText"
            :position="position"
            :max-width="340"
            :disabled="withoutTooltip"
        >
            <template #activator="{ on, attrs }">
                <gwtk-icon-button
                    v-if="iconButton"
                    clean
                    :secondary="secondary"
                    :icon="icon"
                    :icon-size="iconSize"
                    :ripple="false"
                    :href="linkObject.href"
                    :target="linkObject.target"
                    :disabled="disabled"
                    :selected="selected"
                    v-bind="attrs"
                    v-on="{ ...on, ...$listeners }"
                />
                <gwtk-button
                    v-else
                    clean
                    :secondary="secondary"
                    :icon="icon"
                    :icon-size="iconSize"
                    width-available
                    :ripple="false"
                    :href="linkObject.href"
                    :target="linkObject.target"
                    :disabled="disabled"
                    :selected="selected"
                    v-bind="attrs"
                    v-on="{ ...on, ...$listeners }"
                />
            </template>
        </gwtk-tooltip>
    </div>
</template>

<script lang="ts" src="./GwtkToolButton.ts"></script>
