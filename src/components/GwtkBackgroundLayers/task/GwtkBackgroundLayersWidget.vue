<template>
    <gwtk-window-item
        :task-id="taskId"
        :description="description"
        :min-height="378"
        :min-width="420"
        :map-vue="mapVue"
    >
        <div class="gwtk-background-main-panel">
            <v-row v-if="backgroundLayers.length" class="gwtk-background-toolbar">
                <v-tooltip v-if="activeBackground" top>
                    <template #activator="{ on }">
                        <v-col cols="10" class="text-h5 pl-6 gwtk-background-active-title" v-on="on">
                            {{ activeBackground.alias }}
                        </v-col>
                    </template>
                    <div>{{ activeBackground.alias }}</div>
                </v-tooltip>
                <v-col class="gwtk-bacground-options-btn">
                    <v-menu offset-y>
                        <template #activator="{ on: menu, attrs }">
                            <v-tooltip top>
                                <template #activator="{ on: tooltip }">
                                    <gwtk-icon-button
                                        icon="settings"
                                        icon-size="18"
                                        v-bind="attrs"
                                        v-on="{ ...tooltip, ...menu }"
                                    />
                                </template>
                                <div>{{ $t('gwtkbackgroundlayers.Options') }}</div>
                            </v-tooltip>
                        </template>
                        <v-card class="gwtk-background-options">
                            <v-card-subtitle class="subtitle-2">
                                {{ $t('phrases.Opacity') }}
                            </v-card-subtitle>
                            <v-card-text>
                                <v-slider
                                    :value="currentOpacity"
                                    :label="opacityLabel"
                                    hide-details
                                    thumb-label
                                    inverse-label
                                    @change="setActiveLayerOpacity"
                                />
                            </v-card-text>
                        </v-card>
                    </v-menu>
                </v-col>
            </v-row>
            <v-row v-if="!backgroundLayers.length" class="ma-2">
                {{ $t('gwtkbackgroundlayers.Component is not configured') }}
            </v-row>
            <div class="gwtk-backgrounds-list-panel pa-3 mt-8">
                <v-row>
                    <v-col
                        v-for="(item, index) in backgroundLayers"
                        :key="index"
                        cols="auto"
                        class="px-4 pb-8"
                    >
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <v-card
                                    width="96"
                                    height="72"
                                    elevation="0"
                                    outlined
                                    v-on="on"
                                >
                                    <v-img
                                        height="100%"
                                        :src="getImage(item)"
                                        class="white--text align-end gwtk-project-image"
                                        :class="item.active? 'gwtk-active-project' : '' "
                                        gradient="rgba(128,128,128,.45), rgba(128,128,128,.05), rgba(128,128,128,.2)"
                                        cover
                                        @click="toggleItem(item)"
                                    >
                                        <div class="white--text text-body-2 image-title project-title">
                                            <span :title="item.alias">{{ item.alias }}</span>
                                        </div>
                                        <template #placeholder>
                                            <v-row
                                                class="fill-height ma-0"
                                                align="center"
                                                justify="center"
                                            >
                                                <v-progress-circular
                                                    indeterminate
                                                    color="grey lighten-5"
                                                />
                                            </v-row>
                                        </template>
                                    </v-img>
                                    <span class="gwtk-image-text">{{ item.alias }}</span>
                                </v-card>
                            </template>
                            <div>{{ item.alias }}</div>
                        </v-tooltip>
                    </v-col>
                </v-row>
            </div>
        </div>
    </gwtk-window-item>
</template>

<script src="./GwtkBackgroundLayersWidget.ts" />

<style scoped>

.image-title {
  height: 112px;
  padding: 4px;
}

.project-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.gwtk-project-image {
  cursor: pointer;
  opacity: 0.75;
}

.gwtk-project-image:hover {
  opacity: 1;
}

.gwtk-active-project {
  box-shadow: var(--shadow-grey);
  border: solid .2em var(--v-primary-base);
  opacity: 1;
}

.gwtk-image-text {
  display: flex;
  justify-content: center;
}

.gwtk-background-main-panel {
  height: calc(100% - 1px);
  overflow: hidden;
}

.gwtk-backgrounds-list-panel {
  min-height: 120px;
  height: calc(100% - 2em);
  overflow-y: auto;
}

.gwtk-background-options {
  min-width: 220px;
}

.gwtk-background-toolbar {
  max-height: 25px;
}

.gwtk-background-active-title {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.gwtk-bacground-options-btn {
  display: flex;
  justify-content: flex-end;
}

</style>