<template>
  <a class="text-h6">
    {{ title }}
  </a>
  <div class="column">
    <q-btn
      class="q-ma-xs q-ml-auto q-mr-none items-end"
      square
      outline
      size="sm"
      padding="xs"
      color="grey"
      :icon="settingsIcon"
      @click="toggleEditable()"
    />

    <q-list
      bordered
      separator
      :dense="dense"
    >
      <!-- Empty List -->
      <q-item v-if="items.length === 0">
        <q-item-section>
          <q-item-label>
            {{ `No ${itemName.toLowerCase()}s available` }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <!-- Draggable -->
      <template v-else-if="!editable">
        <draggable-item
          v-for="element in items"
          :key="element.id"
          :tag="QItem"
          :item="element"
        >
          <q-item-section>
            <slot
              name="main"
              :item="element"
            />
          </q-item-section>
          <q-item-section side>
            <slot
              name="side"
              :item="element"
            />
          </q-item-section>
        </draggable-item>
      </template>

      <!-- Editable -->
      <template v-else>
        <q-item
          v-for="element in items"
          :key="element.id"
        >
          <q-item-section>
            <slot
              name="main"
              :item="element"
            />
          </q-item-section>

          <q-item-section side>
            <div class="q-gutter-xs">
              <q-btn
                round
                outline
                size="sm"
                padding="xs"
                icon="edit"
                @click="editItem(element)"
              />
              <q-btn
                round
                outline
                size="sm"
                padding="xs"
                icon="delete"
                @click="deleteItem(element)"
              />
            </div>
          </q-item-section>
        </q-item>
      </template>
    </q-list>
    <q-btn-dropdown
      v-if="editable"
      :label="'Add ' + itemName"
      split
      class="q-ma-sm"
      color="primary"
      icon="add"
      rounded
      @click="createItem()"
    >
      <q-list>
        <q-item
          v-close-popup
          clickable
          @click="createItem()"
        >
          <q-item-section>
            <q-item-label>
              {{ 'Create new ' + itemName }}
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="addItem()"
        >
          <q-item-section>
            <q-item-label>
              {{ 'Add ' + itemName + ' from project' }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>

<script lang="ts" generic="T extends Identifiable" setup>
import type { Identifiable } from 'app/src-common/entities';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { QItem } from 'quasar';
import { ref } from 'vue';

const {
  title,
  items,
  itemName = 'item',
  dense = false,
} = defineProps<{
  title: string;
  items: T[];
  itemName?: string;
  dense?: boolean;
}>();

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'add'): void;
  (e: 'edit', item: T): void;
  (e: 'delete', item: T): void;
}>();

const editable = ref(false);
const settingsIcon = ref('settings');

function toggleEditable() {
  editable.value = !editable.value;
  settingsIcon.value = editable.value ? 'done' : 'settings';
}

function editItem(item: T) {
  emit('edit', item);
}

function deleteItem(item: T) {
  emit('delete', item);
}

function createItem() {
  emit('create');
}

function addItem() {
  emit('add');
}
</script>

<style scoped></style>
