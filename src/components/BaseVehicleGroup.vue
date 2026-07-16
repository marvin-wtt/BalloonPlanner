<template>
  <drop-zone
    :classify="classifyDrop"
    class="vehicle-group"
    :class="styleClass"
    @dropped="drop"
  >
    <div class="relative-position">
      <div class="vehicle-group__label">
        <span v-if="showGroupLabel">
          {{ label }}
        </span>

        <span v-if="isCanceled">
          <a v-if="showGroupLabel"> &middot; </a>

          <i>Canceled</i>
        </span>

        <q-badge
          v-if="warningText"
          color="warning"
          class="q-ml-sm"
          rounded
        >
          <q-icon
            name="priority_high"
            color="white"
            size="1em"
          />
          <q-tooltip>
            {{ warningText }}
          </q-tooltip>
        </q-badge>
      </div>

      <div
        class="q-gutter-md q-pa-md q-pb-lg"
        :class="groupAlignment === 'vertical' ? 'row' : 'column'"
      >
        <!-- Balloon -->
        <div v-if="balloon.id !== NULL_ID">
          <base-vehicle
            :key="group.balloonId"
            :vehicle-id="group.balloonId"
            type="balloon"
            :assignment="
              flightLeg?.assignments[group.balloonId] ?? emptyAssignment
            "
            :flight-series
            :flight-leg
            :group
            :editable
          />
        </div>

        <!-- Cars -->
        <div
          v-for="id in group.carIds"
          :key="id"
        >
          <base-vehicle
            type="car"
            :vehicle-id="id"
            :assignment="flightLeg?.assignments[id] ?? emptyAssignment"
            :flight-series
            :flight-leg
            :group
            :editable
          />
        </div>
      </div>
    </div>
  </drop-zone>
</template>

<script lang="ts" setup>
import DropZone from '@/components/drag/DropZone.vue';
import type {
  Car,
  Identifiable,
  Balloon,
  VehicleAssignment,
  FlightSeries,
  FlightLeg,
  VehicleGroup,
} from '@/../src-common/entities';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlightStore } from '@/stores/flight';
import BaseVehicle from '@/components/BaseVehicle.vue';
import { useFlightOperations } from '@/composables/flightOperations';
import { useProjectSettings } from '@/composables/projectSettings';
import { useVehicleGroupProtection } from '@/composables/vehicleGroupProtection';
import { useDragState } from '@/composables/dragState';
import { NULL_ID } from '@/../src-common/constants';

const { groupAlignment, groupStyle, showGroupLabel } = useProjectSettings();
const flightStore = useFlightStore();
const { carMap, balloonMap, personMap } = storeToRefs(flightStore);
const { addCarToVehicleGroup } = useFlightOperations();
const { protectionActive, carIsPlaced, confirmChange } =
  useVehicleGroupProtection();
const { draggedItem } = useDragState();

const {
  flightSeries,
  flightLeg,
  group,
  label = '',
  editable,
} = defineProps<{
  group: VehicleGroup;
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  label?: string;
  editable?: boolean;
}>();

const emptyAssignment: VehicleAssignment = {
  operatorId: null,
  passengerIds: [],
};

const styleClass = computed<string>(() => {
  return [
    isCanceled.value ? 'vehicle-group__canceled' : undefined,
    groupStyle.value === 'dashed'
      ? 'vehicle-group__dashed'
      : 'vehicle-group__highlighted',
    highlightAsTarget.value ? 'vehicle-group__drop-target' : undefined,
  ]
    .filter(Boolean)
    .join(' ');
});

// While a person is being dragged, highlight the group(s) they can be assigned
// to without breaking consistency with the previous leg (i.e. where dropping
// them is an `accept`, not a `warn`).
const highlightAsTarget = computed<boolean>(() => {
  const item = draggedItem.value;
  if (!item || !(item.id in personMap.value)) {
    return false;
  }

  return !isCanceled.value && personBelongsToGroup(item.id);
});

const warningText = computed<string | null>(() => {
  if (trailerClutchWarning.value) {
    return 'The group is missing a trailer clutch';
  }

  if (reservedCapacityWarning.value) {
    return 'The group does not have enough car capacity';
  }

  return null;
});

const cars = computed<Car[]>(() => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return group.carIds.map((id) => carMap.value[id]!);
});

const balloon = computed<Balloon>(() => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return balloonMap.value[group.balloonId]!;
});

const trailerClutchWarning = computed<boolean>(() => {
  return (
    group.balloonId !== NULL_ID &&
    !cars.value.some((car) => car.hasTrailerClutch)
  );
});

const reservedCapacityWarning = computed<boolean>(() => {
  const availableCapacity = cars.value.reduce(
    (prev, curr) => prev + curr.maxCapacity - 1,
    0,
  );

  const isReduced = flightLeg.reducedCapacityBalloonIds.includes(
    group.balloonId,
  );
  const effectiveCapacity = isReduced
    ? balloon.value.maxCapacity - 1
    : balloon.value.maxCapacity;

  return effectiveCapacity > availableCapacity;
});

const isCanceled = computed<boolean>(() => {
  return flightLeg.canceledBalloonIds.includes(group.balloonId);
});

function elementIsCar(element: Identifiable): element is Car {
  return flightSeries.carIds.includes(element.id);
}

// Group-level mirror of the per-cell previous-leg check in
// BaseVehiclePersonCell: is the person part of this group in the previous leg?
function personBelongsToGroup(personId: string): boolean {
  const idx = flightSeries.legs.findIndex((l) => l.id === flightLeg.id);
  // First leg: nothing constrains the person yet, so any group is valid.
  if (idx === 0) {
    return true;
  }

  const previousLeg = flightSeries.legs[idx - 1];
  if (!previousLeg) {
    return false;
  }

  const groupVehicleIds = [group.balloonId, ...group.carIds];
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

function classifyDrop(element: Identifiable): 'accept' | 'warn' | 'reject' {
  if (!editable) {
    return 'reject';
  }

  if (!elementIsCar(element)) {
    return 'reject';
  }

  if (group.carIds.some((id) => id === element.id)) {
    return 'reject';
  }

  // Moving an already-placed car clears assignments in the other legs, so warn
  // that the drop will ask for confirmation.
  return protectionActive.value && carIsPlaced(element.id) ? 'warn' : 'accept';
}

async function drop(element: Identifiable) {
  if (!elementIsCar(element)) {
    return;
  }

  // Only a move from another group is destructive; a fresh car from the tray
  // is not, so it never prompts. The removal from the source group shares this
  // decision, so the dialog is shown only once per move.
  if (carIsPlaced(element.id) && !(await confirmChange())) {
    return;
  }

  addCarToVehicleGroup(group.balloonId, element.id);
}
</script>

<style lang="scss" scoped>
.vehicle-group {
  border-radius: 15px;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

/* Ring shown around a group that the person being dragged can be assigned to.
   box-shadow keeps the layout stable and follows the rounded corners. */
.vehicle-group__drop-target {
  box-shadow: 0 0 0 3px $primary;
}

/* The dashed variant already draws its own border, so recolor that instead of
   stacking a ring outside it (which reads as a competing double line). */
.vehicle-group__dashed.vehicle-group__drop-target {
  border-style: solid;
  border-color: $primary;
  box-shadow: none;
}

.vehicle-group__canceled {
  opacity: 0.5;
}

.vehicle-group > div {
  padding: 0 3px;
  margin-top: -0.8em;
}

.vehicle-group__label {
  background: white none repeat scroll 0 0;
  display: inline-block;
  padding: 0 5px;
  border-radius: 10px;
  margin-left: 1em;
  font-weight: bold;
}

.vehicle-group__dashed {
  border-style: dashed;
  border-width: 2px;
  border-color: $grey-7;
  background-color: $grey-3;

  .vehicle-group__label {
    background-color: $grey-3;
  }
}

.vehicle-group__highlighted {
  border: none;
  background-color: $grey-5;
}
</style>
