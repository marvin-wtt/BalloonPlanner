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
        v-if="showInfo"
        class="q-ml-xs"
      >
        <q-icon
          name="sym_o_error"
          :color="infoColor"
          size="sm"
          dense
        >
          <q-tooltip>
            {{ infoText }}
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
const { showPersonWeight, showNumberOfFlights, personDefaultWeight } =
  useProjectSettings();
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

  const weight = person.weight ?? personDefaultWeight.value ?? '?';
  const suffix = !person.weight && personDefaultWeight.value ? '*' : '';

  return ` (${weight.toString()}${suffix} kg)`;
});

const coloredLabels = computed<boolean>(() => {
  return (
    (showPersonWeight.value ?? false) && (showNumberOfFlights.value ?? false)
  );
});

const showInfo = computed<boolean>(() => {
  return (
    overfilled ||
    hasInvalidOperator.value ||
    hasMultiLegError.value ||
    hasLanguageWarning.value
  );
});

const infoColor = computed<string>(() => {
  if (overfilled || hasInvalidOperator.value || hasMultiLegError.value) {
    return 'negative';
  }

  if (hasLanguageWarning.value) {
    return 'warning';
  }

  return 'info';
});

const infoText = computed<string>(() => {
  if (overfilled) {
    return 'Vehicle capacity exceeded';
  }

  if (hasInvalidOperator.value) {
    return 'Person not allowed to operate this vehicle';
  }

  if (hasMultiLegError.value) {
    return 'Person was not assigned to this group in previous flight';
  }

  if (hasLanguageWarning.value) {
    return 'No common language with passenger';
  }

  return '';
});

const hasLanguageWarning = computed<boolean>(() => {
  if (operator || !assignment.operatorId || !person || !person.languages) {
    return false;
  }

  const languages = personMap.value[assignment.operatorId]?.languages;
  if (languages == undefined) {
    return false;
  }

  return !languages.some((language) => person.languages?.includes(language));
});

const hasMultiLegError = computed<boolean>(() => {
  if (
    !person ||
    flightSeries.legs.length <= 1 ||
    flightSeries.legs.indexOf(flightLeg) <= 0
  ) {
    return false;
  }

  const firstLeg = flightSeries.legs[0];
  if (!firstLeg) {
    return false;
  }

  const vehicleIds = Object.entries(firstLeg.assignments).find(
    ([, assignment]) => {
      return (
        assignment.operatorId === person.id ||
        assignment.passengerIds.includes(person.id)
      );
    },
  );
  if (!vehicleIds) {
    return false;
  }

  const firstVehicleId = vehicleIds[0];

  return (
    group.balloonId === firstVehicleId || group.carIds.includes(firstVehicleId)
  );
});

const hasInvalidOperator = computed<boolean>(() => {
  if (!person || !operator) {
    return false;
  }

  return !vehicle.allowedOperatorIds.includes(person.id);
});

function isDropAllowed(element: Identifiable): boolean {
  if (!editable) {
    return false;
  }

  if (!(element.id in personMap.value)) {
    return false;
  }

  if (!wasInSameVehicleGroupInFirstLeg(element.id)) {
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

function wasInSameVehicleGroupInFirstLeg(personId: string): boolean {
  if (flightSeries.legs.length < 1) {
    return true;
  }

  const firstLeg = flightSeries.legs[0];

  // Find the vehicle group containing the current vehicle
  const currentGroup = flightSeries.vehicleGroups.find(
    (g) => g.balloonId === vehicle.id || g.carIds.includes(vehicle.id),
  );
  if (!currentGroup) {
    return false;
  }

  // Collect all vehicle IDs of this group
  const groupVehicleIds = [currentGroup.balloonId, ...currentGroup.carIds];

  // Check if person was in any of these vehicles in the first leg
  return groupVehicleIds.some((vid) => {
    const assignment = firstLeg.assignments[vid];
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
