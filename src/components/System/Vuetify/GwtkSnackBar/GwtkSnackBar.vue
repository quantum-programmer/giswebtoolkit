<template>
    <div class="gwtk-snack-bar-root">
        <v-snackbar
            v-for="(item, index) in messages"
            :key="index"
            content-class="gwtk-snack-bar"
            :value="item.snackbar"
            :timeout="timeout"
            transition="fade-transition"
            color="var(--v-primary-base)"
            :style="{bottom:calcMargin(index)+'px'}"
            absolute
            @input="$emit('close',index, item)"
        >
            {{ item.text }}
            <slot :item="item" />
            <template #action="{ attrs }">
                <v-btn
                    class="gwtk-snack-bar-button"
                    text
                    v-bind="attrs"
                    @click="$emit('close',index, item)"
                >
                    {{ $t('phrases.' + 'Close') }}
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script lang="ts" src="./GwtkSnackBar.ts"></script>

<style>
    .gwtk-snack-bar-root > div {
        opacity: 0.94;
    }

    .gwtk-snack-bar {
        color: var(--color-white);
    }

    .gwtk-snack-bar-button.v-btn {
        color: var(--color-white);
    }
</style>

