<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
    >
        <gwtk-tabs
            v-show="isLogged"
            v-model="activeTab"
            class="pl-4 pb-4"
        >
            <gwtk-tab
                key="settingsTab"
                :title="$t('exportReport.Settings') + ''"
            />
            <gwtk-tab
                key="templatesTab"
                :title="$t('exportReport.Templates') + ''"
            />
        </gwtk-tabs>
        <v-tabs-items
            v-model="activeTab"
        >
            <v-tab-item
                value="settingsTab"
            >
                <v-form
                    ref="constructorForm"
                    v-model="formIsValid"
                    :disabled="exporting"
                >
                    <gwtk-layers-list
                        v-show="!isVersionTransneft || layersSelectedFromTemplate.length"
                        :map-vue="mapVue"
                        :layer-ids="layerIds"
                        :set-layers-selected="setLayersSelected"
                        :use-layers-from-template="useLayersFromTemplate"
                        :layers-selected-from-template="layersSelectedFromTemplate"
                        :disabled="exporting"
                        :is-version-transneft="isVersionTransneft"
                        @toggleUseLayersFromTemplate="toggleUseLayersFromTemplate"
                        @updateLayers="updateLayers"
                    />

                    <v-select
                        :value="constructorOptions.format"
                        :items="formats"
                        :label="$t('exportReport.Format') + ''"
                        item-value="code"
                        item-text="text"
                        class="ma-4"
                        hide-details
                        dense
                        outlined
                        @change="setFormat"
                    />

                    <v-select
                        :value="constructorOptions.dpi"
                        :items="dpi"
                        :label="$t('exportReport.Print resolution, dots per inch') + ''"
                        item-value="code"
                        item-text="text"
                        item-disabled="disabled"
                        class="ma-4"
                        hide-details
                        dense
                        outlined
                        @change="setDpi"
                    />

                    <gwtk-chevron-switcher
                        :title="$t('exportReport.Font') + ''"
                        class="my-3"
                    >
                        <template
                            #body
                        >
                            <v-select
                                :value="constructorOptions.font.family"
                                :items="fonts"
                                :label="$t('exportReport.Font family') + ''"
                                item-value="code"
                                item-text="text"
                                class="mb-4"
                                hide-details
                                dense
                                outlined
                                @change="setFontFamily"
                            />

                            <v-text-field
                                :value="constructorOptions.font.size"
                                :rules="fontSizeRules(constructorOptions.font.minFontSize, constructorOptions.font.maxFontSize)"
                                :min="constructorOptions.font.minFontSize"
                                :max="constructorOptions.font.maxFontSize"
                                :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
                                type="number"
                                hide-details="auto"
                                outlined
                                dense
                                @input="setFontSize"
                            />
                        </template>
                    </gwtk-chevron-switcher>

                    <gwtk-chevron-switcher
                        v-if="isPdf"
                        :title="$t('exportReport.Page settings') + ''"
                        class="my-3"
                    >
                        <template
                            #body
                        >
                            <v-select
                                :value="constructorOptions.pageOptions.format"
                                :items="pageFormats"
                                :label="$t('exportReport.Format') + ''"
                                item-value="code"
                                item-text="text"
                                class="mb-4"
                                hide-details
                                dense
                                outlined
                                @change="setPageFormat"
                            />

                            <v-select
                                :value="constructorOptions.pageOptions.orientation"
                                :items="pageOrientations"
                                :label="$t('exportReport.Orientation') + ''"
                                item-value="code"
                                item-text="text"
                                class="mb-4"
                                hide-details
                                dense
                                outlined
                                @change="setPageOrientation"
                            />

                            <v-card-subtitle
                                class="pt-0 px-0"
                            >
                                {{ $t('exportReport.Margins') }}, {{ $t('exportReport.mm') }}
                            </v-card-subtitle>

                            <v-card-text
                                class="pb-0 px-0 d-flex flex-wrap"
                            >
                                <v-text-field
                                    v-for="(margin, marginIndex) in constructorOptions.pageOptions.margins"
                                    :key="'page-margin-' + marginIndex"
                                    :value="margin"
                                    :rules="pageMarginRules"
                                    :max="constructorOptions.pageOptions.maxMargin"
                                    :label="getPageMarginFieldLabel(marginIndex)"
                                    type="number"
                                    min="0"
                                    style="min-width: 50%;"
                                    hide-details="auto"
                                    class="mb-4"
                                    outlined
                                    dense
                                    @input="setPageMargin(marginIndex, $event)"
                                />
                            </v-card-text>
                        </template>
                    </gwtk-chevron-switcher>

                    <gwtk-options-block
                        :show="constructorOptions.showLogotype"
                        :label="$t('exportReport.Logotype') + ''"
                        :rules="showLogotypeRules"
                        @setShow="setShowLogotype"
                    >
                        <gwtk-select-logotype
                            :logotypes="logotypes"
                            :logotype="constructorOptions.logotypeOptions.logotype"
                            :disabled="exporting"
                            @setLogotype="setLogotype"
                        />

                        <div
                            class="d-flex mt-4"
                        >
                            <v-text-field
                                :value="constructorOptions.logotypeOptions.position.top"
                                :rules="logotypePositionRules"
                                :max="constructorOptions.logotypeOptions.maxPosition"
                                :label="$t('exportReport.Margin top') + ', ' + $t('exportReport.pix')"
                                type="number"
                                min="0"
                                outlined
                                dense
                                @input="setLogotypePositionTop"
                            />

                            <v-text-field
                                :value="constructorOptions.logotypeOptions.position.left"
                                :rules="logotypePositionRules"
                                :max="constructorOptions.logotypeOptions.maxPosition"
                                :label="$t('exportReport.Margin left') + ', ' + $t('exportReport.pix')"
                                type="number"
                                min="0"
                                outlined
                                dense
                                @input="setLogotypePositionLeft"
                            />
                        </div>
                    </gwtk-options-block>

                    <gwtk-options-block
                        v-if="isPdf"
                        :show="constructorOptions.showHeaders"
                        :label="$t('exportReport.Headers') + ''"
                        @setShow="setShowHeaders"
                    >
                        <gwtk-header-item
                            v-for="(header, headerIndex) in constructorOptions.headerOptions.headers"
                            :key="'header-item-' + headerIndex"
                            :header="header"
                            :fonts="fonts"
                            :show-headers="constructorOptions.showHeaders"
                            :options="constructorOptions.headerOptions"
                            :index="headerIndex"
                            :map-vue="mapVue"
                            @setText="setHeaderText(headerIndex, $event)"
                            @setFontFamily="setHeaderFontFamily(headerIndex, $event)"
                            @setFontSize="setHeaderFontSize(headerIndex, $event)"
                        />

                        <div
                            v-if="isVersionNative"
                        >
                            {{ $t('exportReport.Subheaders') }}
                            <gwtk-tooltip
                                :text="$t('exportReport.Add header') + ''"
                            >
                                <template
                                    #activator="{ on, attrs }"
                                >
                                    <gwtk-icon-button
                                        icon="mdi-plus"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="addHeader"
                                    />
                                </template>
                            </gwtk-tooltip>

                            <gwtk-tooltip
                                :text="$t('exportReport.Remove header') + ''"
                            >
                                <template
                                    #activator="{ on, attrs }"
                                >
                                    <gwtk-icon-button
                                        :disabled="constructorOptions.headerOptions.headers.length === 1"
                                        icon="mdi-minus"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="removeHeader"
                                    />
                                </template>
                            </gwtk-tooltip>
                        </div>
                    </gwtk-options-block>

                    <gwtk-options-block
                        :show="constructorOptions.showLegend"
                        :disabled="!isLegendAvailable"
                        :label="$t('exportReport.Legend') + ''"
                        @setShow="setShowLegend"
                    >
                        <v-select
                            :value="constructorOptions.legendOptions.iconSize"
                            :items="iconSizes"
                            :label="$t('exportReport.Icon size') + ', ' + $t('exportReport.pix')"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            outlined
                            dense
                            @change="setLegendIconSize"
                        />

                        <v-select
                            :value="constructorOptions.legendOptions.fontFamily"
                            :items="fonts"
                            :label="$t('exportReport.Font family') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            dense
                            outlined
                            @change="setLegendFontFamily"
                        />

                        <v-text-field
                            :value="constructorOptions.legendOptions.fontSize"
                            :rules="legendFontSizeRules"
                            :min="constructorOptions.legendOptions.minFontSize"
                            :max="constructorOptions.legendOptions.maxFontSize"
                            :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
                            type="number"
                            outlined
                            dense
                            @input="setLegendFontSize"
                        />

                        <gwtk-checkbox
                            v-if="isPdf"
                            :value="constructorOptions.legendOptions.aboveMap"
                            :label="$t('exportReport.Place on top of map') + ''"
                            style="position: relative; top: -16px;"
                            dense
                            @change="setLegendAboveMap"
                        />

                        <div
                            v-if="constructorOptions.legendOptions.aboveMap || !isPdf"
                            class="d-flex"
                        >
                            <v-text-field
                                :value="constructorOptions.legendOptions.position.right"
                                :rules="legendPositionRules"
                                :max="constructorOptions.legendOptions.maxPosition"
                                :label="$t('exportReport.Margin right') + ', ' + $t('exportReport.pix')"
                                type="number"
                                min="0"
                                outlined
                                dense
                                @input="setLegendPositionRight"
                            />

                            <v-text-field
                                :value="constructorOptions.legendOptions.position.bottom"
                                :rules="legendPositionRules"
                                :max="constructorOptions.legendOptions.maxPosition"
                                :label="$t('exportReport.Margin bottom') + ', ' + $t('exportReport.pix')"
                                type="number"
                                min="0"
                                outlined
                                dense
                                @input="setLegendPositionBottom"
                            />
                        </div>
                    </gwtk-options-block>

                    <gwtk-checkbox
                        :value="constructorOptions.showNorthArrow"
                        :label="$t('exportReport.North arrow') + ''"
                        class="ml-4 my-3"
                        dense
                        @change="setShowNorthArrow"
                    />

                    <gwtk-checkbox
                        :value="constructorOptions.showScale"
                        :label="$t('exportReport.Scale') + ''"
                        class="ml-4 my-3"
                        dense
                        @change="setShowScale"
                    />

                    <gwtk-checkbox
                        :value="constructorOptions.showScaleBar"
                        :label="$t('exportReport.Scale bar') + ''"
                        class="ml-4 my-3"
                        dense
                        @change="setShowScaleBar"
                    />

                    <gwtk-checkbox
                        :value="constructorOptions.showCoordinateSystem"
                        :label="$t('exportReport.Coordinate system') + ''"
                        class="ml-4 my-3"
                        dense
                        @change="setShowCoordinateSystem"
                    />

                    <gwtk-options-block
                        :show="constructorOptions.showCoordinateGrid"
                        :label="$t('exportReport.Coordinate grid') + ''"
                        @setShow="setShowCoordinateGrid"
                    >
                        <v-select
                            :value="constructorOptions.coordinateGridOptions.systemType"
                            :items="exportReportCoordinateGridSystemTypes"
                            :label="$t('exportReport.Coordinate system type') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            outlined
                            dense
                            @change="setCoordinateGridSystemType"
                        />

                        <v-select
                            v-show="isMetersCoordinateSystemType"
                            :value="constructorOptions.coordinateGridOptions.stepMeters"
                            :items="coordinateGridStepsMeters"
                            :label="$t('exportReport.Grid step') + ''"
                            item-value="code"
                            item-text="text"
                            hide-details
                            outlined
                            dense
                            @change="setCoordinateGridStepMeters"
                        />

                        <v-select
                            v-show="isDegreesCoordinateSystemType"
                            :value="constructorOptions.coordinateGridOptions.stepDegrees"
                            :items="coordinateGridStepsDegrees"
                            :label="$t('exportReport.Grid step') + ''"
                            item-value="code"
                            item-text="text"
                            hide-details
                            outlined
                            dense
                            @change="setCoordinateGridStepDegrees"
                        />

                        <div
                            class="pt-4"
                        />
                    </gwtk-options-block>

                    <gwtk-options-block
                        v-if="isPdf"
                        :show="constructorOptions.showFeatures"
                        :label="$t('exportReport.Selected features table') + ''"
                        :disabled="!featuresSelected || exporting"
                        @setShow="setShowFeatures"
                    >
                        <v-select
                            :value="constructorOptions.featuresOptions.fontFamily"
                            :items="fonts"
                            :label="$t('exportReport.Font family') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            dense
                            outlined
                            @change="setFeaturesFontFamily"
                        />

                        <v-text-field
                            :value="constructorOptions.featuresOptions.fontSize"
                            :rules="featuresFontSizeRules"
                            :min="constructorOptions.featuresOptions.minFontSize"
                            :max="constructorOptions.featuresOptions.maxFontSize"
                            :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
                            type="number"
                            class="mb-4"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setFeaturesFontSize"
                        />
                    </gwtk-options-block>

                    <gwtk-options-block
                        v-if="isPdf && isVersionTransneft"
                        :show="constructorOptions.showAttributes"
                        :label="$t('exportReport.Attributive data table') + ''"
                        :loading="isAttributesFetching"
                        :error-message="attributesError"
                        @setShow="setShowAttributes"
                    >
                        <gwtk-checkbox
                            v-if="constructorOptions.showAttributes && attributesFetchParameters"
                            :value="useAttributesFetchParameters"
                            :label="$t('exportReport.Use parameters from template') + ''"
                            class="ml-12 my-3"
                            dense
                            @change="toggleAndUpdateAttributes"
                        />

                        <v-select
                            :value="constructorOptions.attributesOptions.fontFamily"
                            :items="fonts"
                            :label="$t('exportReport.Font family') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            dense
                            outlined
                            @change="setAttributesFontFamily"
                        />

                        <v-text-field
                            :value="constructorOptions.attributesOptions.fontSize"
                            :rules="attributesFontSizeRules"
                            :min="constructorOptions.attributesOptions.minFontSize"
                            :max="constructorOptions.attributesOptions.maxFontSize"
                            :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
                            type="number"
                            class="mb-4"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setAttributesFontSize"
                        />
                    </gwtk-options-block>

                    <gwtk-options-block
                        v-if="isPdf"
                        :show="constructorOptions.showPageNumeration"
                        :label="$t('exportReport.Page numeration') + ''"
                        @setShow="setShowPageNumeration"
                    >
                        <v-select
                            :value="constructorOptions.pageNumerationOptions.fontFamily"
                            :items="fonts"
                            :label="$t('exportReport.Font family') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            dense
                            outlined
                            @change="setPageNumerationFontFamily"
                        />

                        <v-text-field
                            :value="constructorOptions.pageNumerationOptions.fontSize"
                            :rules="pageNumerationFontSizeRules"
                            :min="constructorOptions.pageNumerationOptions.minFontSize"
                            :max="constructorOptions.pageNumerationOptions.maxFontSize"
                            :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
                            type="number"
                            class="mb-4"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setPageNumerationFontSize"
                        />

                        <v-text-field
                            :value="constructorOptions.pageNumerationOptions.bottom"
                            :rules="pageNumerationBottomRules"
                            :max="constructorOptions.pageNumerationOptions.maxBottom"
                            :label="$t('exportReport.Margin bottom') + ', ' + $t('exportReport.mm')"
                            type="number"
                            min="0"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setPageNumerationBottom"
                        />

                        <div
                            class="pt-4"
                        />
                    </gwtk-options-block>

                    <gwtk-options-block
                        v-if="isPdf"
                        :show="constructorOptions.showDate"
                        :label="$t('exportReport.Date') + ''"
                        @setShow="setShowDate"
                    >
                        <v-select
                            :value="constructorOptions.dateOptions.format"
                            :items="dateFormats"
                            :label="$t('exportReport.Date format') + ''"
                            item-value="code"
                            item-text="text"
                            hide-details
                            outlined
                            dense
                            @change="setDateFormat"
                        />

                        <div
                            class="pt-4"
                        />
                    </gwtk-options-block>

                    <gwtk-options-block
                        v-if="isPdf"
                        :show="constructorOptions.showStamp"
                        :label="$t('exportReport.Stamp') + ''"
                        @setShow="setShowStamp"
                    >
                        <v-select
                            :value="constructorOptions.stampOptions.type"
                            :items="stamps"
                            :label="$t('exportReport.Stamp type') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            outlined
                            dense
                            @change="setStampType"
                        />

                        <v-select
                            :value="constructorOptions.stampOptions.fontFamily"
                            :items="fonts"
                            :label="$t('exportReport.Font family') + ''"
                            item-value="code"
                            item-text="text"
                            class="mb-4"
                            hide-details
                            dense
                            outlined
                            @change="setStampFontFamily"
                        />

                        <v-text-field
                            :value="constructorOptions.stampOptions.fontSize"
                            :rules="stampFontSizeRules"
                            :min="constructorOptions.stampOptions.minFontSize"
                            :max="constructorOptions.stampOptions.maxFontSize"
                            :label="$t('exportReport.Font size') + ', ' + $t('exportReport.pix')"
                            type="number"
                            class="mb-4"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setStampFontSize"
                        />

                        <v-textarea
                            :value="constructorOptions.stampOptions.organizationName"
                            :rules="stampTextRules"
                            :maxlength="constructorOptions.stampOptions.maxLength"
                            :label="$t('exportReport.Organization name') + ''"
                            rows="2"
                            class="mb-4"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setStampOrganizationName"
                        />

                        <v-textarea
                            :value="constructorOptions.stampOptions.organizationAddress"
                            :rules="stampTextRules"
                            :maxlength="constructorOptions.stampOptions.maxLength"
                            :label="$t('exportReport.Organization address') + ''"
                            rows="2"
                            hide-details="auto"
                            outlined
                            dense
                            @input="setStampOrganizationAddress"
                        />

                        <div
                            class="pt-4"
                        />
                    </gwtk-options-block>
                </v-form>

                <v-card
                    flat
                >
                    <v-card-actions
                        class="pr-4 pl-4"
                    >
                        <v-spacer />

                        <v-progress-circular
                            v-if="exporting"
                            :value="currentProgress * 100"
                            class="mr-4"
                            color="primary"
                        />

                        <gwtk-button
                            :class="isReducedInterface ? 'submit-form-button-reduced' : ''"
                            :disabled="!formIsValid || exporting || isAttributesFetching"
                            :title="$t('exportReport.Export') + ''"
                            icon="mdi-export"
                            primary
                            @click="submitForm"
                        />
                    </v-card-actions>
                </v-card>
            </v-tab-item>

            <v-tab-item
                value="templatesTab"
            >
                <constructor-templates
                    :constructor-templates-public="constructorTemplatesPublic"
                    :constructor-templates-local="constructorTemplatesLocal"
                    :form-is-valid="formIsValid"
                    :set-state="setState"
                    :is-logged="isLogged"
                    :is-admin="isAdmin"
                    :user-name="userName"
                    :map-vue="mapVue"
                    @switchToSettingsTab="switchToSettingsTab"
                />
            </v-tab-item>
        </v-tabs-items>
    </gwtk-task-container-item>
</template>

<script src="./GwtkExportReportWidget.ts"></script>

<style scoped>
.attributes-error {
    margin-top: -12px;
}

.submit-form-button-reduced.v-btn:not(.v-btn--round).v-size--default {
    height: var(--v-btn-height--small);
}
</style>
