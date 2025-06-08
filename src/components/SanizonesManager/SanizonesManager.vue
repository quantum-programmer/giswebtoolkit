/* eslint-disable vue/html-indent, vue/script-indent */
  <template>
<div class="sanizones-manager">
  <v-card>
    <v-card-title>
      Управление санитарными зонами
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="openCreateDialog">
        Добавить запись
      </v-btn>
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="sanizones"
      :loading="loading"
    >
      <template v-slot:item.actions="{ item }">
        <v-icon small @click="openEditDialog(item)">mdi-pencil</v-icon>
        <v-icon small @click="openDeleteDialog(item)">mdi-delete</v-icon>
      </template>
    </v-data-table>
  </v-card>

  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>{{ formTitle }}</v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.address"
                label="Адрес"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.square_zone"
                label="Площадь зоны"
                type="number"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="editedItem.service_org"
                label="Сервисная организация"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="closeDialog">
          Отмена
        </v-btn>
        <v-btn color="blue darken-1" text @click="save">
          Сохранить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="500px">
    <v-card>
      <v-card-title>Подтвердите удаление</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="deleteDialog = false">
          Отмена
        </v-btn>
        <v-btn color="blue darken-1" text @click="deleteItem">
          Удалить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</div>
</template>

<script>
import SanizonesService from './SanizonesService';

export default {
  name: 'SanizonesManager',
  data() {
    return {
      sanizones: [],
      loading: false,
      headers: [
        { text: 'Адрес', value: 'address' },
        { text: 'Площадь зоны', value: 'square_zone' },
        { text: 'Сервисная организация', value: 'service_org' },
        { text: 'Действия', value: 'actions', sortable: false }
      ],
      dialog: false,
      deleteDialog: false,
      editedIndex: -1,
      editedItem: {
        address: '',
        square_zone: 0,
        service_org: ''
      },
      defaultItem: {
        address: '',
        square_zone: 0,
        service_org: ''
      },
      itemToDelete: null
    };
  },
  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'Новая запись' : 'Редактирование';
    }
  },
  async created() {
    await this.fetchSanizones();
  },
  methods: {
    async fetchSanizones() {
      this.loading = true;
      try {
        this.sanizones = await SanizonesService.getSanizones();
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        this.loading = false;
      }
    },
    openCreateDialog() {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
      this.dialog = true;
    },
    openEditDialog(item) {
      this.editedIndex = this.sanizones.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
    },
    openDeleteDialog(item) {
      this.itemToDelete = item;
      this.deleteDialog = true;
    },
    closeDialog() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },
    async save() {
      try {
        if (this.editedIndex > -1) {
          await SanizonesService.updateSanizone(this.editedItem);
          Object.assign(this.sanizones[this.editedIndex], this.editedItem);
        } else {
          const newItem = await SanizonesService.createSanizone(this.editedItem);
          this.sanizones.push(newItem);
        }
        this.closeDialog();
      } catch (error) {
        console.error('Ошибка сохранения:', error);
      }
    },
    async deleteItem() {
      try {
        await SanizonesService.deleteSanizone(this.itemToDelete.id);
        this.sanizones = this.sanizones.filter(item => item.id !== this.itemToDelete.id);
        this.deleteDialog = false;
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  }
};
</script>

<style scoped>
.sanizones-manager {
  padding: 20px;
}
</style>