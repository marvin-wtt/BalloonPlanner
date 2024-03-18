<template>
  <div class="q-py-md">
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
              {{
                t('list.empty.label', { name: itemName.toLowerCase() + 's' })
              }}
            </q-item-label>
            <q-item-label caption>
              {{
                t('list.empty.caption', { name: itemName.toLowerCase() + 's' })
              }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <!-- Draggable -->
        <draggable-item
          v-else-if="!editable"
          :tag="QItem"
          v-for="element in items"
          :key="element.id"
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
                  color="warning"
                  icon="edit"
                  @click="editItem(element)"
                />
                <q-btn
                  round
                  outline
                  size="sm"
                  padding="xs"
                  color="negative"
                  icon="delete"
                  @click="deleteItem(element)"
                />
              </div>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
      <q-btn
        v-if="editable"
        class="q-ma-sm"
        color="primary"
        icon="add"
        :label="$t('list.item.create', { name: itemName.toLowerCase() })"
        @click="addItem()"
      />
    </div>
  </div>
</template>

<script lang="ts" generic="T extends Identifiable" setup>
import { Identifiable } from 'src/lib/utils/Identifiable';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { QItem } from 'quasar';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  title: string;
  items: T[];
  itemName?: string;
  dense?: boolean;
}

withDefaults(defineProps<Props>(), {
  itemName: 'item',
  dense: false,
});

const emit = defineEmits<{
  (e: 'create'): void;
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

function addItem() {
  emit('create');
}
</script>

<style scoped></style>
