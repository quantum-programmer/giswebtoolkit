<template>
    <v-container class="gwtk-main-view gwtk-map-editor-manual-input px-2">
        <v-row class="flex-grow-0 mb-2">
            <v-col class="pb-1">
                <span class="text-subtitle-1">
                    {{ $t("mapeditor.Create object in local coording system") }}
                </span>
            </v-col>
        </v-row>
        <v-row class="flex-grow-0 mb-2">
            <v-col class="py-0">
                <v-autocomplete
                    :items="crsItems"
                    :value="crsItems[0]"
                    item-text="title"
                    item-value="epsg"
                    :label="$t('mapeditor.Coordinate system')"
                    flat
                    outlined
                    dense
                    hide-details
                    clearable
                    :menu-props="{ contentClass:'gwtk-map-editor-manual-input-select-crs' }"
                    @change="changePublishObjectCrs"
                >
                    <template #item="{ item }">
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <div class="v-list-item__content">
                                    <div class="v-list-item__title" v-on="on">
                                        {{ item.title }}
                                    </div>
                                </div>
                            </template>
                            <div>{{ item.comment }}</div>
                        </v-tooltip>
                    </template>
                </v-autocomplete>
            </v-col>
        </v-row>
        <v-row v-if="publishObject.objectName" class="flex-grow-0 my-0">
            <v-col class="py-0 pr-0">
                <span class="text-subtitle-1">
                    {{ `${publishObject.objectName}, ` }}
                </span>
                <span class=" text-subtitle-1 text-lowercase">
                    {{ $t(`mapeditor.${publishObject.mapObjectType}`) + '.' }}
                </span>
            </v-col>
        </v-row>
        <v-row
            align="center"
            class="flex-grow-0 mt-0"
            :class="isReducedSizeInterface?'mb-2':'mb-3'"
            justify="space-between"
        >
            <v-col
                cols="auto"
                class="py-0"
            >
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-button
                            secondary
                            icon="mdi-plus"
                            :disabled="!isAddNewPointReady"
                            v-on="on"
                            @click="addNewPoint()"
                        />
                    </template>
                    <div>{{ $t('mapeditor.Add point') }}</div>
                </v-tooltip>
            </v-col>
            <v-col         
                cols="auto"
                class="py-0"
            >
                <v-menu offset-y content-class="gwtk-map-editor-manual-input-add-menu">
                    <template #activator="{ on: menu, attrs }">
                        <v-tooltip bottom>
                            <template #activator="{ on: tooltip }">
                                <gwtk-icon-button
                                    class="ma-2"
                                    icon="dots"
                                    v-bind="attrs"
                                    v-on="{ ...tooltip, ...menu }"
                                />
                            </template>
                            <div>{{ $t('mapeditor.Additionally') }}</div>
                        </v-tooltip>
                    </template>
                    <v-list>
                        <v-list-item
                            v-for="(button, bIndex) in publishObject.buttonsActions"
                            :key="bIndex"
                            class="gwtk-map-editor-menu"
                            :disabled="false"
                            @click="processItem(button.value, undefined)"
                        >
                            <v-list-item-icon class="mr-2">
                                <v-icon>{{ getListItemIcon(button.value) }}</v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                <v-list-item-title>{{ button.text }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-col>
        </v-row>
        <v-divider />
        <v-container class="gwtk-map-editor-manual-input-point-list-container" :style="{ height: isReducedSizeInterface ? '60%' : '50%'}">
            <div>
                <v-row
                    v-for="(coordinates, index) in publishObject.coordinatesList"
                    :key="index"
                    dense
                    justify="space-between"
                >
                    <v-col
                        cols="1"
                        :style="'align-self: ' + (index === 0 ? 'flex-start' : 'center')"
                    >
                        <div
                            v-if="index === 0"
       
                            :class="[isReducedSizeInterface?'mb-2 pb-1':'mb-2 pb-2']"
                        > 
                            {{ '№' }}
                        </div>
                        <span>
                            {{ (index + 1) }}
                        </span>
                    </v-col>
                    <v-col
                        cols="3"
                        class="px-1"
                        align="center"
                    >
                        <div
                            v-if="index === 0"
                            align="center"
                            :class="isReducedSizeInterface?'mb-2':'mb-2'"
                        >
                            {{ latitudeTitle + unitTitle }}
                        </div>
                        <v-text-field
                            class="centered-input"
                            dense
                            flat
                            hide-details
                            outlined
                            solo
                            type="number"
                            hide-spin-buttons
                            maxlength="13"
                            :value="coordinates[0]"
                            :readonly="isLastPolygonPoint(index)"
                            @change="(value)=> changeX(index, value)"
                        />
                    </v-col>
                    <v-col
                        cols="3"
                        class="px-1"
                        align="center"
                    >
                        <div
                            v-if="index === 0"
                            align="center"
                            :class="isReducedSizeInterface?'mb-2':'mb-2'"
                        >
                            {{ longitudeTitle + unitTitle }}
                        </div>
                        <v-text-field
                            class="centered-input"
                            dense
                            flat
                            hide-details
                            outlined
                            solo
                            type="number"
                            hide-spin-buttons
                            maxlength="13"
                            :value="coordinates[1]"
                            :readonly="isLastPolygonPoint(index)"
                            @change="(value)=>changeY(index, value)"
                        />
                    </v-col>
                    <v-col
                        cols="2"
                        class="px-1"
                        align="center"
                    >
                        <div
                            v-if="index === 0"
                            align="center"
                            :class="isReducedSizeInterface?'mb-2':'mb-2'"
                        >
                            {{ $t('mapeditor.Height') + unitTitle }}
                        </div>
                        <v-text-field
                            class="centered-input"
                            dense
                            flat
                            solo
                            outlined
                            type="number"
                            hide-spin-buttons
                            hide-details
                            :value="coordinates[2]"
                            :readonly="isLastPolygonPoint(index)"
                            @change="(value)=>changePointHeight(index, value)"
                        />
                    </v-col>
                    <v-col
                        cols="auto"
                        align="center"
                    >
                        <v-row
                            align="center"
                            :class="index === 0? 'mt-4' : ''"
                        >
                            <v-col cols="auto">
                                <gwtk-button
                                    secondary
                                    icon="trash-can"
                                    :disabled="isLastPolygonPoint(index)"
                                    @click="() => removePoint(index)"
                                />
                            </v-col>
                        </v-row>
                    </v-col>
                </v-row>
            </div>
        </v-container>
        <v-divider />
        <v-row justify="space-around" class="gwtk-publish-object-execute py-2">
            <gwtk-button
                primary
                width="35%"
                :disabled="!isReady"
                :title="$t('mapeditor.Execute')"
                @click="apply"
            />
            <gwtk-button
                secondary
                width="35%"
                :title="$t('mapeditor.Cancel')"
                @click="cancel"
            />
        </v-row>
    </v-container>
</template>

<script lang="ts" src="./GwtkMapEditorManualInputCoords.ts" />

<style scoped>
.gwtk-publish-object-execute {
  margin: 0.6em 0;
  display: flex;
  justify-content: space-between;
  align-content: flex-end;
}

.gwtk-main-view {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between
}

.point-list { 
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.gwtk-map-editor-manual-input-point-list-container { 
    overflow-y: auto;
    overflow-x: hidden;
}
.centered-input {
    max-width: 200px;
}
.gwtk-map-editor-manual-input-add-menu .v-list-item__icon {
    align-self: center;
}
</style>