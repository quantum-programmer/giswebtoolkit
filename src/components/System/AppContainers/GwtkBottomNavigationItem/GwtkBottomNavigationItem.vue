<template>
    <gwtk-nav-button
        :class="!description.enabled?'disabled-action':''"
        :icon="description.options.icon"
        :link-object="description.options.link"
        :selected="description.active"
        :name="$t(description.options.title)"
        :disabled="!description.enabled"
        :list-item="listItem"
        @click="onClick"
    />
</template>

<script lang="ts" src="./GwtkBottomNavigationItem.ts" />