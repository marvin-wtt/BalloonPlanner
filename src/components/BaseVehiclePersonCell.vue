<template>
  <drop-zone
    v-if="person"
    :tag="operator ? 'th' : 'td'"
    :class="{ 'text-negative': overfilled, 'blocked-slot': blocked }"
    :classify="classifySwap"
    @dropped="onSwapDrop"
  >
    <draggable-item
      :item="person"
      :label="person.name"
      :disabled="!editable"
      @complete="onDragComplete()"
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
          class="q-ml-xs no-wrap row items-center"
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

          <span
            v-if="status.suffix"
            class="status-suffix"
            :class="`text-${status.color}`"
          >
            {{ status.suffix }}
          </span>
        </div>
      </div>

      <person-info-menu
        :flight-series
        :person
      />

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
            @click="onRemove()"
          >
            <q-item-section class="text-negative">Remove</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </draggable-item>
  </drop-zone>

  <component
    :is="operator ? 'th' : 'td'"
    v-else-if="blocked"
    class="blocked-slot"
  >
    <q-icon
      name="sym_o_do_not_disturb_on"
      size="xs"
      class="text-grey-5"
    >
      <q-tooltip>Place blocked for this leg</q-tooltip>
    </q-icon>
  </component>

  <drop-zone
    v-else
    :tag="operator ? 'th' : 'td'"
    :classify="classifyDrop"
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
} from '@/../src-common/entities';
import { computed } from 'vue';
import DropZone from '@/components/drag/DropZone.vue';
import DraggableItem from '@/components/drag/DraggableItem.vue';
import { useFlightStore } from '@/stores/flight';
import { storeToRefs } from 'pinia';
import { useFlightOperations } from '@/composables/flightOperations';
import EditPersonDialog from '@/components/dialog/EditPersonDialog.vue';
import { useQuasar } from 'quasar';
import { useProjectStore } from '@/stores/project';
import { useProjectSettings } from '@/composables/projectSettings';
import { useAssignmentProtection } from '@/composables/assignmentProtection';
import PersonInfoMenu from '@/components/PersonInfoMenu.vue';
import { vehicleGroupLabel } from '@/util/group';
import { DragHelper } from '@/util/DragHelper';

const quasar = useQuasar();
const projectStore = useProjectStore();
const { project } = storeToRefs(projectStore);
const flightStore = useFlightStore();
const { personMap, balloonMap, carMap, numberOfFlights } =
  storeToRefs(flightStore);
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
  replaceVehiclePassenger,
} = useFlightOperations();
const { confirmChange } = useAssignmentProtection();

const {
  person = null,
  vehicle,
  assignment,
  flightSeries,
  flightLeg,
  group,
  editable,
  operator,
  overfilled,
  blocked,
} = defineProps<{
  person?: Person | null;
  vehicle: Vehicle;
  assignment: VehicleAssignment;
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  group: VehicleGroup;
  operator?: boolean;
  editable?: boolean;
  overfilled?: boolean;
  blocked?: boolean;
}>();

interface StatusInfo {
  color: string;
  text: string;
  icon: string;
  suffix?: string | undefined;
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
    overfillStatus.value,
    operatorInfo.value,
    blockedStatus.value,
    multiLegStatus.value,
    languageStatus.value,
  ].find((info): info is StatusInfo => info !== false);
});

const overfillStatus = computed<StatusInfo | false>(() => {
  if (!overfilled) {
    return false;
  }

  return {
    icon: 'sym_o_error',
    color: 'negative',
    text: 'Vehicle capacity exceeded',
  };
});

const blockedStatus = computed<StatusInfo | false>(() => {
  if (!blocked) {
    return false;
  }

  return {
    icon: 'sym_o_do_not_disturb_on',
    color: 'warning',
    text: 'Place blocked for this leg',
  };
});

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
    suffix: findPreviousGroupLabel(person.id),
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

function classifyDrop(element: Identifiable): 'accept' | 'warn' | 'reject' {
  if (!editable || !(element.id in personMap.value)) {
    return 'reject';
  }

  if (operator) {
    if (!vehicle.allowedOperatorIds.includes(element.id)) {
      return 'reject';
    }
  } else if (assignment.passengerIds.includes(element.id)) {
    return 'reject';
  }

  // Assigning to a different group than the previous leg is allowed, but warn
  // (and, when protection is active, confirm on drop) that it breaks cross-leg
  // group consistency.
  return wasInSameVehicleGroupInPreviousLeg(element.id) ? 'accept' : 'warn';
}

async function onDrop(element: Identifiable) {
  // A cross-group assignment breaks consistency with the previous leg. When
  // protection is active, confirm before proceeding.
  const sameGroup = wasInSameVehicleGroupInPreviousLeg(element.id);
  if (sameGroup || disableAssignmentProtection.value) {
    // Plain move: the source cell removes its person on drag end as usual.
    addPersonToVehicle(element.id);
    return;
  }

  // The confirmation outlives the drag, but the source's drag-end removal
  // fires immediately — declining would still leave the person unassigned.
  // So the whole move (source removal included) is applied here instead;
  // dropHandled must be set before any await so the source cell skips its
  // removal.
  DragHelper.dropHandled = true;

  const confirmed = await confirmChange();
  if (!confirmed) {
    return;
  }

  const source = findPersonSlot(element.id);
  if (source) {
    if (source.operator) {
      setVehicleOperator(source.vehicleId, null);
    } else {
      removeVehiclePassenger(source.vehicleId, element.id);
    }
  }

  addPersonToVehicle(element.id);
}

function onDragComplete() {
  // A swap drop has already reassigned both people, including removing this
  // cell's person from here; the usual source-side removal must be skipped.
  if (DragHelper.dropHandled) {
    return;
  }

  onRemove();
}

function onRemove() {
  if (!person) {
    return;
  }

  removePersonFromVehicle(person.id);
}

interface PersonSlot {
  vehicleId: string;
  operator: boolean;
}

function findPersonSlot(personId: string): PersonSlot | null {
  for (const [vehicleId, a] of Object.entries(flightLeg.assignments)) {
    if (a.operatorId === personId) {
      return { vehicleId, operator: true };
    }

    if (a.passengerIds.includes(personId)) {
      return { vehicleId, operator: false };
    }
  }

  return null;
}

function findVehicle(vehicleId: string): Vehicle | undefined {
  return carMap.value[vehicleId] ?? balloonMap.value[vehicleId];
}

function findVehicleGroup(vehicleId: string): VehicleGroup | undefined {
  return flightSeries.vehicleGroups.find(
    (g) => g.balloonId === vehicleId || g.carIds.includes(vehicleId),
  );
}

function classifySwap(
  element: Identifiable,
): 'accept' | 'warn' | 'reject' | null {
  if (!person || element.id === person.id) {
    return null;
  }

  if (!editable || !(element.id in personMap.value)) {
    return 'reject';
  }

  // Only a person already seated in this leg can swap seats
  const source = findPersonSlot(element.id);
  if (!source) {
    return 'reject';
  }

  // The dragged person must be able to take this seat …
  if (operator && !vehicle.allowedOperatorIds.includes(element.id)) {
    return 'reject';
  }

  // … and this cell's person must be able to take the vacated seat
  if (source.operator) {
    const sourceVehicle = findVehicle(source.vehicleId);
    if (!sourceVehicle?.allowedOperatorIds.includes(person.id)) {
      return 'reject';
    }
  }

  const sourceGroup = findVehicleGroup(source.vehicleId);
  const consistent =
    wasInSameVehicleGroupInPreviousLeg(element.id) &&
    (!sourceGroup ||
      wasInSameVehicleGroupInPreviousLeg(person.id, sourceGroup));

  return consistent ? 'accept' : 'warn';
}

async function onSwapDrop(element: Identifiable) {
  if (!person) {
    return;
  }

  const source = findPersonSlot(element.id);
  if (!source) {
    return;
  }

  // The whole swap is applied here, so the source cell's drag-end removal has
  // to be skipped. Must be set before any await: the source's drag end fires
  // right after this drop handler yields.
  DragHelper.dropHandled = true;

  if (classifySwap(element) === 'warn' && !disableAssignmentProtection.value) {
    const confirmed = await confirmChange();
    if (!confirmed) {
      return;
    }
  }

  const occupantId = person.id;

  // In-place replacement keeps each seat row. The target seat must be filled
  // before the source seat: for a swap within the same passenger list, the
  // source-side replacement must find the dragged person at their original
  // index, not the one just swapped in.
  if (operator) {
    setVehicleOperator(vehicle.id, element.id);
  } else {
    replaceVehiclePassenger(vehicle.id, occupantId, element.id);
  }

  if (source.operator) {
    setVehicleOperator(source.vehicleId, occupantId);
  } else {
    replaceVehiclePassenger(source.vehicleId, element.id, occupantId);
  }
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

function wasInSameVehicleGroupInPreviousLeg(
  personId: string,
  inGroup: VehicleGroup = group,
): boolean {
  if (isFirstLeg.value) {
    return true;
  }

  const idx = flightSeries.legs.findIndex((l) => l.id === flightLeg.id);
  const previousLeg = flightSeries.legs[idx - 1];
  if (!previousLeg) {
    return false;
  }

  const groupVehicleIds = [inGroup.balloonId, ...inGroup.carIds];

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

function findPreviousGroupLabel(personId: string): string | undefined {
  if (isFirstLeg.value) {
    return undefined;
  }

  const idx = flightSeries.legs.findIndex((l) => l.id === flightLeg.id);
  const previousLeg = flightSeries.legs[idx - 1];
  if (!previousLeg) {
    return undefined;
  }

  const previousGroupIndex = flightSeries.vehicleGroups
    .map((group) => [group.balloonId, ...group.carIds])
    .findIndex((vehicleIds) => {
      return vehicleIds.some((vehicleId) => {
        const assignment = previousLeg.assignments[vehicleId];
        if (!assignment) {
          return false;
        }

        return (
          assignment.operatorId === personId ||
          assignment.passengerIds.includes(personId)
        );
      });
    });

  if (previousGroupIndex === -1) {
    return undefined;
  }

  return vehicleGroupLabel(previousGroupIndex);
}
</script>

<style scoped>
.blocked-slot {
  text-align: center;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(0, 0, 0, 0.06) 4px,
    rgba(0, 0, 0, 0.06) 8px
  );
}

/* Compact “badge-like” suffix aligned to the icon */
.status-suffix {
  margin-left: 2px;
  font-size: 0.8em;
  line-height: 1;
  font-weight: 600;
  vertical-align: middle;
}
</style>
