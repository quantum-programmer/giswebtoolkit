<template>
    <div>
        <gwtk-tool-button
            :icon="description.options.icon"
            :icon-button="iconButton"
            :tooltip-text="$t(description.options.title)"
            :without-tooltip="withoutTooltip"
            :list-item="listItem"
            :link-object="description.options.link"
            :selected="active"
            :disabled="!description.enabled"
            :position="position"
            @click="onClick"
        />
    </div>
</template>

<script lang="ts" src="./GwtkToolbarItem.ts" />
