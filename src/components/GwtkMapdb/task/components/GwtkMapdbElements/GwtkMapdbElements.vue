<template>
    <div
        ref="table"
        style="height: calc(100%); overflow: hidden; width: 100%;"
    >
        <v-simple-table
            fixed-header
            :height="height"
            dense
        >
            <template #default>
                <thead align="center">
                    <tr>
                        <th style="width: 20px; padding: 1px;" />
                        <th style="width: 20px; padding: 1px" />
                        <th>
                            {{ 'id' }}
                        </th>
                        <th
                            v-for="(item, idx) in fields? onlyFieldList : objectInfo"
                            v-show="item.field !== 'id' && checkBox(item.field)"
                            :key="idx"
                            style="text-align: center;"
                        >
                            {{ item.field }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(element, idx) in showElements"
                        :key="idx"
                        :class="{selected: addClass(element)}"
                        style="cursor: pointer"
                        @click.stop="clickOnObjectWidget(element.id)"
                    >
                        <td style="width: 20px; padding: 1px">
                            <gwtk-button
                                secondary
                                class="gwtk-test-mapdb-geolocation my-2 mx-1"
                                icon="geolocation"
                                icon-size="18"
                                :selected="outlinedMarker(element)"
                                @click.stop="clickOnMarkerWidget(element)"
                            />
                        </td>
                        <td style="width: 20px; padding: 1px">
                            <gwtk-button
                                secondary
                                class="gwtk-test-mapdb-info my-2"
                                icon="mdi-information-variant"
                                icon-size="18"
                                @click.stop="onClickShowInfoWidget(idx)"
                            />
                        </td>
                        <td>
                            {{ element['id'] }}
                        </td>
                        <td
                            v-for="(item, id) in objectInfo"
                            v-show="item.field !== 'id' && onlyField(element[item.field], item.field) && checkBox(item.field)"
                            :key="id"
                            align="center"
                            :style=" element[item.field]? '' : 'color: gray'"
                        >
                            {{ element[item.field] ? element[item.field] : '-' }}
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>
    </div>
</template>

<script lang="ts" src="./GwtkMapdbElements.ts" />

<style scoped>
.selected {
    background-color: var(--v-primary-lighten4);
}
</style>