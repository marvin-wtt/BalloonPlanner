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
        class="vehicle-group__vehicles"
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

      <group-handover-list
        v-if="showHandover"
        :flight-series="flightSeries"
        :flight-leg="flightLeg"
        :group="group"
      />
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
import GroupHandoverList from '@/components/GroupHandoverList.vue';
import { useFlightOperations } from '@/composables/flightOperations';
import { useProjectSettings } from '@/composables/projectSettings';
import { useVehicleGroupProtection } from '@/composables/vehicleGroupProtection';
import { useDragState } from '@/composables/dragState';
import { NULL_ID } from '@/../src-common/constants';

const { groupAlignment, groupStyle, showGroupLabel, showHandover } =
  useProjectSettings();
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
  border-radius: var(--radius-group);
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}

/* Ring shown around a group that the person being dragged can be assigned to.
   box-shadow keeps the layout stable and follows the rounded corners. */
.vehicle-group__drop-target {
  box-shadow:
    0 0 0 3px $primary,
    var(--shadow-card);
}

/* The dashed variant already draws its own border, so recolor that instead of
   stacking a ring outside it (which reads as a competing double line). */
.vehicle-group__dashed.vehicle-group__drop-target {
  border-style: solid;
  border-color: $primary;
  box-shadow: none;
}

.vehicle-group__canceled {
  opacity: 0.55;
}

.vehicle-group > div {
  padding: 0;
  margin-top: -0.8em;
}

/* Vehicles sit on a single inset that the label aligns to (both 14px), with an
   even gap between them. Replaces the stacked q-pa-md / q-pb-lg / q-gutter-md
   utilities so the padding no longer doubles up and the bottom isn't cavernous. */
.vehicle-group__vehicles {
  padding: 8px 14px 14px;
  gap: 12px;
}

/* Group label as a manifest-section chip: uppercase, tracked, and lifted just
   off the card so it reads as a heading without a full header bar. */
.vehicle-group__label {
  display: inline-block;
  margin-left: 14px;
  padding: 3px 12px;
  border-radius: var(--radius-chip);
  background: var(--surface-card);
  color: var(--ink-strong);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: var(--shadow-card);
}

.vehicle-group__label a {
  color: var(--ink-faint);
}

.vehicle-group__dashed {
  border: 2px dashed var(--border-strong);
  background-color: var(--surface-group-dashed);

  .vehicle-group__label {
    background-color: var(--surface-group-dashed);
    border: 1px solid var(--border-strong);
    box-shadow: none;
  }
}

.vehicle-group__highlighted {
  border: 1px solid var(--border-subtle);
  background-color: var(--surface-group);
  box-shadow: var(--shadow-card);
}
</style>
