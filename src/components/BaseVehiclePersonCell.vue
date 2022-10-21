<template>
  <draggable-item
    :tag="operator ? 'th' : 'td'"
    v-if="person !== undefined"
    :item="person"
    @remove="onDragEnd"
  >
    {{ personLabel }}

    <q-menu touch-position context-menu>
      <q-list dense style="min-width: 100px">
        <q-item clickable v-close-popup>
          <q-item-section @click="dialogs.showEditPerson(person)">
            {{ $t('edit') }}
          </q-item-section>
        </q-item>
        <q-item clickable v-close-popup>
          <q-item-section @click="onDragEnd(person)" class="text-negative">
            {{ $t('remove') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </draggable-item>

  <drop-zone
    v-else
    :tag="operator ? 'th' : 'td'"
    :accepted="isDropAllowed"
    @dropped="onDrop"
  />
</template>

<script lang="ts" setup>
import { Balloon, Person, Vehicle } from 'src/lib/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import { Identifyable } from 'src/lib/utils/Identifyable';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useDialogs } from 'src/composables/dialogs';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

interface Props {
  person: Person;
  vehicle: Vehicle;
  editable?: boolean;
  operator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  operator: false,
  editable: true,
});

const $q = useQuasar();
const { t } = useI18n();
const dialogs = useDialogs($q, t);

const emit = defineEmits<{
  (e: 'operatorAdd', person: Person): void;
  (e: 'operatorRemove', person: Person): void;
  (e: 'passengerAdd', person: Person): void;
  (e: 'passengerRemove', person: Person): void;
}>();

const personLabel = computed(() => {
  if (props.person === undefined) {
    return '';
  }

  let label = props.person.name;
  if (props.editable) {
    const isBalloon = props.vehicle instanceof Balloon;
    const flights = props.person.numberOfFlights;

    label += isBalloon ? ` (${flights - 1})` : `(${flights})`;
  }

  return label;
});

function isDropAllowed(element: Identifyable): boolean {
  if (!(element instanceof Person)) {
    return false;
  }

  if (props.operator) {
    return props.vehicle.allowedOperators.includes(element);
  }

  return !props.vehicle.passengers.includes(element);
}

function onDrop(element: Person) {
  if (props.operator) {
    emit('operatorAdd', element);
  } else {
    emit('passengerAdd', element);
  }
}

function onDragEnd(element: Person) {
  if (props.operator) {
    emit('operatorRemove', element);
  } else {
    emit('passengerRemove', element);
  }
}
</script>

<style scoped></style>
