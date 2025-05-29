<template>
    <gwtk-menu
        theme="clean"
        icon="dots"
        icon-color=" var(--v-primary-base)"
        icon-size="18"
        :close-on-content-click="closeOnContentClick"
    >
        <v-list>
            <gwtk-list-item
                :title="showAllIconTitle"
                @click="showAll"
            />
            <gwtk-list-item
                :title="hideAllIconTitle"
                @click="hideAll"
            />
        </v-list>
    </gwtk-menu>
</template>

<script lang="ts" src="./GwtkGroupItemMenuWidget.ts" />
