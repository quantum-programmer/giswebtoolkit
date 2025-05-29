<template>
    <div
        :class="$vuetify.breakpoint.smAndUp?'gwtk-copyright caption':'gwtk-copyright caption gwtk-copyright-mobile'"
    >
        <div
            v-if="nameCompany"
            class="gwtk-copyright-background"
        >
            {{ nameCompany }}
        </div>
        <div
            v-if="privacyPolicy"
            class="gwtk-copyright-background"
        >
            <a :href="privacyPolicy.url">
                {{ privacyPolicy.alias }}
            </a>
        </div>
    </div>
</template>
<script src="./GwtkCopyRightWidget.ts" />

<style scoped>
    .gwtk-copyright {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        position: absolute;
        z-index: 1;
        bottom: 5px;
        right: 5px;

    }

    .gwtk-copyright-mobile {
        bottom: 12px;
    }

    .gwtk-copyright-background {
        background-color: var(--color-white);
        opacity: 0.8;
        border-radius: 5px;
        padding: 0 4px;
    }
</style>