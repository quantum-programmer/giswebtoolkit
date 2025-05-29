<template>
    <gwtk-snack-bar
        :messages="messages"
        :timeout="timeout"
        @close="(index)=>onClose(index)"
    >
        <template #default="{item}">
            <template v-if="item && item.data">
                <br>
                <a
                    style="color: inherit"
                    href="#"
                    @click="$emit('openLog')"
                >
                    {{ `(${$t('phrases.Total errors').toLowerCase()}: ${item.data.errorCount})` }}
                </a>
            </template>
        </template>
    </gwtk-snack-bar>
</template>

<script lang="ts" src="./GwtkMapSnackBar.ts"></script>

