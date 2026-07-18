<template>
  <div class="column">
    <div class="panel-header row items-center no-wrap q-mb-sm">
      <div class="panel-header__title col-grow">
        {{ title }}
        <span class="panel-header__count">{{ items.length }}</span>
      </div>
      <div class="row items-center no-wrap q-gutter-xs">
        <slot name="header-actions" />
        <q-btn
          square
          outline
          size="sm"
          padding="xs"
          color="grey"
          :icon="editable ? 'check' : 'edit'"
          @click="toggleEditable()"
        >
          <q-tooltip>{{ editable ? 'Done editing' : 'Edit list' }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-list
      bordered
      separator
      class="panel-list"
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
          @start="updateDragging(true)"
          @complete="updateDragging(false)"
          @cancel="updateDragging(false)"
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
import type { Identifiable } from '@/../src-common/entities';
import DraggableItem from '@/components/drag/DraggableItem.vue';
import { QItem } from 'quasar';
import { inject, ref } from 'vue';

const {
  title,
  items,
  itemName = 'item',
  dense,
} = defineProps<{
  title: string;
  items: T[];
  itemName?: string;
  dense?: boolean;
}>();

const emit = defineEmits<{
  (e: 'create' | 'add'): void;
  (e: 'edit' | 'delete', item: T): void;
}>();

const updateDragging = inject<(v: boolean) => void>(
  'flight-panel-list-dragging',
  () => undefined,
);

const editable = ref(false);

function toggleEditable() {
  editable.value = !editable.value;
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

<style scoped>
.panel-header__title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink-strong);
}

/* Live count of what's in the tray, so the section header doubles as a status. */
.panel-header__count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-muted);
  background: var(--surface-group);
  border-radius: var(--radius-chip);
  padding: 1px 9px;
  min-width: 1.6rem;
  text-align: center;
}

.panel-list {
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--surface-card);
  border-color: var(--border-subtle);
}
</style>
