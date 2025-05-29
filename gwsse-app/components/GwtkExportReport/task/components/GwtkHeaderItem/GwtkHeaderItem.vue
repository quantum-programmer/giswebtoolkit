<template>
    <div>
        <v-divider
            v-if="index"
            style="margin: 0 -16px 28px; width: calc(100% + 32px); max-width: calc(100% + 32px);"
        />
        <v-textarea
            :value="header.text"
            :rules="textRules"
            :max="options.maxLength"
            :label="index ? $t('exportReport.Subheader') : $t('exportReport.Header')"
            rows="2"
            class="mb-4"
            hide-details="auto"
            outlined
            dense
            @input="setText"
        />
        <v-select
            :value="header.fontFamily"
            :items="fonts"
            :label="$t('exportReport.Font family')"
            item-value="code"
            item-text="text"
            class="mb-4"
            hide-details
            dense
            outlined
            @change="setFontFamily"
        />
        <v-text-field
            :value="header.fontSize"
            :rules="fontSizeRules"
            :min="options.minFontSize"
            :max="options.maxFontSize"
            :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
            type="number"
            hide-details="auto"
            outlined
            dense
            @input="setFontSize"
        />
        <div class="pt-4" />
    </div>
</template>

<script src="./GwtkHeaderItem.ts"></script>
