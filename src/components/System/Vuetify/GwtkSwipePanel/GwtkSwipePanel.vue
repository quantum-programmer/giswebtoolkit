<template>
    <!-- такое страшное выражение - для проверки, есть ли задачи активные,
     поскольку gwtk-task-container всегда возвращает элемент,
     но у него пустой массив components в случае отсутствия задач -->
    <div
        v-show="$slots.default && $slots.default[0] && $slots.default[0].child && $slots.default[0].child.components.length>0"
        v-resize="updateResize"
        class="gwtk-swipe-panel"
    >
        <v-sheet
            ref="swipePanel"
            class="gwtk-swipe-panel-body"
            :class="gwtkSwipeButtonStyle.color?'gwtk-swipe-panel-body-white':undefined"
            :style="{transform, transition}"
            @transitionend="checkTransform"
        >
            <button
                class="gwtk-swipe-panel-move-btn"
                :style="gwtkSwipeButtonStyle"
                type="button"
                @touchstart="initMove"
                @touchmove="movePanel"
                @touchend="stopMove"
                @click="expandCollapse"
            />

            <div ref="swipePanelContent">
                <slot />
            </div>
        </v-sheet>
    </div>
</template>

<script lang="ts" src="./GwtkSwipePanel.ts"></script>

<style scoped>
    .gwtk-swipe-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 2;
        pointer-events: none;
    }

    .gwtk-swipe-panel-body {
        will-change: transform;
        height: 100%;
        box-shadow: var(--shadow-grey);
        transform: translate3d(0, 100%, 0);
        border-radius: 16px 16px 0 0;
        pointer-events: all;
    }

    .gwtk-swipe-panel-body::before {
        pointer-events: none;
        content: "";
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        width: 64px;
        height: 4px;
        background: var(--v-secondary-lighten5);
        border-radius: 2px;
    }

    .gwtk-swipe-panel-body-white:before {
        background: var(--color-white);
    }

    .gwtk-swipe-panel-move-btn {
        width: 100%;
        height: 36px;
        margin: 0;
        border-radius: inherit;
    }
</style>