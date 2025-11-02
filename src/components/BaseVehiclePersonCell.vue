<template>
  <draggable-item
    v-if="person"
    :tag="operator ? 'th' : 'td'"
    :item="person"
    :label="person.name"
    :disabled="!editable"
    :class="overfilled ? 'text-negative' : ''"
    @remove="onDragEnd()"
  >
    <div class="row no-wrap items-center">
      <div class="col-grow">
        <span>
          {{ person.name }}
        </span>
        <span
          v-if="showNumberOfFlights"
          :class="coloredLabels ? 'text-blue' : ''"
        >
          {{ flightsLabel }}
        </span>
        <span
          v-if="showPersonWeight"
          :class="coloredLabels ? 'text-orange' : ''"
        >
          {{ weightLabel }}
        </span>
      </div>

      <div
        v-if="status"
        class="q-ml-xs"
      >
        <q-icon
          :name="status.icon"
          :color="status.color"
          size="sm"
          dense
        >
          <q-tooltip>
            {{ status.text }}
          </q-tooltip>
        </q-icon>
      </div>
    </div>

    <q-menu
      touch-position
      context-menu
    >
      <q-list
        dense
        style="min-width: 100px"
      >
        <q-item
          v-close-popup
          clickable
          @click="onEdit()"
        >
          <q-item-section>Edit</q-item-section>
        </q-item>
        <q-item
          v-close-popup
          clickable
          @click="onDragEnd()"
        >
          <q-item-section class="text-negative">Remove</q-item-section>
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
import type {
  Person,
  Vehicle,
  Identifiable,
  VehicleAssignment,
  FlightLeg,
  FlightSeries,
  VehicleGroup,
} from 'app/src-common/entities';
import { computed } from 'vue';
import DropZone from 'components/drag/DropZone.vue';
import DraggableItem from 'components/drag/DraggableItem.vue';
import { useFlightStore } from 'stores/flight';
import { storeToRefs } from 'pinia';
import { useFlightOperations } from 'src/composables/flightOperations';
import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { useQuasar } from 'quasar';
import { useProjectStore } from 'stores/project';
import { useProjectSettings } from 'src/composables/projectSettings';

const quasar = useQuasar();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { personMap, numberOfFlights } = storeToRefs(flightStore);
const {
  showPersonWeight,
  showNumberOfFlights,
  personDefaultWeight,
  disableAssignmentProtection,
} = useProjectSettings();
const {
  editPerson,
  setVehicleOperator,
  addVehiclePassenger,
  removeVehiclePassenger,
} = useFlightOperations();

const {
  person = undefined,
  vehicle,
  assignment,
  flightSeries,
  flightLeg,
  group,
  editable = false,
  operator = false,
  overfilled = false,
} = defineProps<{
  person?: Person;
  vehicle: Vehicle;
  assignment: VehicleAssignment;
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  group: VehicleGroup;
  operator?: boolean;
  editable?: boolean;
  overfilled?: boolean;
}>();

interface StatusInfo {
  color: string;
  text: string;
  icon: string;
}

const flightsLabel = computed<string>(() => {
  if (!person) {
    return '';
  }

  const flights = numberOfFlights.value[person.id] ?? 0;
  const suffix = flights === 0 && person.firstTime ? '*' : '';

  return ` (${flights.toString()}${suffix})`;
});

const weightLabel = computed<string>(() => {
  if (!person) {
    return '';
  }

  const weight = person.weight ?? personDefaultWeight.value ?? '';
  const suffix = !person.weight ? '?' : '';

  return ` (${weight.toString()}${suffix} kg)`;
});

const coloredLabels = computed<boolean>(() => {
  return (
    (showPersonWeight.value ?? false) && (showNumberOfFlights.value ?? false)
  );
});

const status = computed<StatusInfo | undefined>(() => {
  return [
    overfillStatus,
    operatorInfo.value,
    multiLegStatus.value,
    languageStatus.value,
  ].filter((info) => info !== false)[0];
});

const overfillStatus: StatusInfo | false = overfilled
  ? {
      icon: 'sym_o_error',
      color: 'negative',
      text: 'Vehicle capacity exceeded',
    }
  : false;

const languageStatus = computed<StatusInfo | false>(() => {
  if (!person || !person.languages) {
    return false;
  }

  const hasCommonLang = (personId: string | undefined | null) => {
    if (!personId) {
      return true;
    }

    const otherLangs = personMap.value[personId]?.languages;
    if (!otherLangs) {
      return true;
    }

    return otherLangs.some((language) => person.languages?.includes(language));
  };

  // Car operators need a common language with the pilot
  if (operator) {
    if (vehicle.type === 'balloon') {
      return false;
    }

    const pilotId = flightLeg.assignments[group.balloonId]?.operatorId;
    if (hasCommonLang(pilotId)) {
      return false;
    }

    return {
      icon: 'sym_o_translate',
      color: 'warning',
      text: 'No common language with pilot',
    };
  }

  if (hasCommonLang(assignment.operatorId)) {
    return false;
  }

  // For balloons, every person needs a common language with the operator
  if (vehicle.type === 'balloon') {
    return {
      icon: 'sym_o_translate',
      color: 'warning',
      text: 'No common language with operator',
    };
  }

  if (person.role === 'counselor') {
    return false;
  }

  // For cars, every person needs at least a common language with another passenger
  const hasCommonLangWithPassengers = assignment.passengerIds
    .filter((id) => id !== person.id)
    .flatMap((id) => personMap.value[id]?.languages)
    .filter((lang) => lang !== undefined)
    .some((lang) => person.languages?.includes(lang));

  if (hasCommonLangWithPassengers) {
    return false;
  }

  return {
    icon: 'sym_o_translate',
    color: 'warning',
    text: 'No common language with operator or other passengers',
  };
});

const multiLegStatus = computed<StatusInfo | false>(() => {
  if (!person) {
    return false;
  }

  if (wasInSameVehicleGroupInPreviousLeg(person.id)) {
    return false;
  }

  return {
    icon: 'sym_o_swap_horiz',
    color: 'negative',
    text: `${person.name} was assigned to different group in previous flight`,
  };
});

const operatorInfo = computed<StatusInfo | false>(() => {
  if (!person || !operator) {
    return false;
  }

  if (vehicle.allowedOperatorIds.includes(person.id)) {
    return false;
  }

  return {
    icon: 'sym_o_do_not_disturb_on',
    color: 'negative',
    text: `${person.name} not allowed to operate this vehicle`,
  };
});

const isFirstLeg = computed<boolean>(() => {
  return flightSeries.legs.findIndex((l) => l.id === flightLeg.id) === 0;
});

function isDropAllowed(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (!(element.id in personMap.value)) {
    return false;
  }

  if (
    !wasInSameVehicleGroupInPreviousLeg(element.id) &&
    !disableAssignmentProtection.value
  ) {
    return false;
  }

  if (operator) {
    return vehicle.allowedOperatorIds.includes(element.id);
  }

  return !assignment.passengerIds.includes(element.id);
}

function onDrop(element: Identifiable) {
  addPersonToVehicle(element.id);
}

function onDragEnd() {
  if (!person) {
    return;
  }
  removePersonFromVehicle(person.id);
}

function onEdit() {
  if (!project.value || !person) {
    return;
  }
  quasar
    .dialog({
      component: EditPersonDialog,
      componentProps: {
        person,
        existingNames: project.value.people.map(({ name }) => name),
      },
    })
    .onOk((payload) => {
      editPerson(person.id, payload);
    });
}

function addPersonToVehicle(personId: string) {
  if (operator) {
    setVehicleOperator(vehicle.id, personId);
  } else {
    addVehiclePassenger(vehicle.id, personId);
  }
}

function removePersonFromVehicle(personId: string) {
  if (operator) {
    setVehicleOperator(vehicle.id, null);
  } else {
    removeVehiclePassenger(vehicle.id, personId);
  }
}

function wasInSameVehicleGroupInPreviousLeg(personId: string): boolean {
  if (isFirstLeg.value) {
    return true;
  }

  const idx = flightSeries.legs.findIndex((l) => l.id === flightLeg.id);
  const previousLeg = flightSeries.legs[idx - 1];
  if (!previousLeg) {
    return false;
  }

  // Collect all vehicle IDs of this group
  const groupVehicleIds = [group.balloonId, ...group.carIds];

  // Check if person was in any of these vehicles in the first leg
  return groupVehicleIds.some((vid) => {
    const assignment = previousLeg.assignments[vid];
    if (!assignment) {
      return false;
    }
    return (
      assignment.operatorId === personId ||
      assignment.passengerIds.includes(personId)
    );
  });
}
</script>

<style scoped></style>
