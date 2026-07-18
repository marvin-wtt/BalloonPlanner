<template>
  <div
    v-if="rows.length"
    class="handover shadow-1"
  >
    <div class="handover__title">
      <span class="handover__title-glyph">&#8644;</span>
      <span>Handover &middot; next leg</span>
    </div>

    <div
      v-for="(row, i) in rows"
      :key="i"
      class="handover__move"
    >
      <template v-if="row.kind === 'swap'">
        <span class="handover__pair">
          <span class="handover__name">{{ personName(row.outId) }}</span>
          <span class="handover__swap">&#8644;</span>
          <span class="handover__name">{{ personName(row.inId) }}</span>
        </span>
      </template>
      <template v-else>
        <span
          class="handover__dir"
          :class="`handover__dir--${row.kind}`"
          >{{ row.kind === 'out' ? '→' : '←' }}</span
        >
        <span class="handover__name">{{ personName(row.personId) }}</span>
      </template>

      <span
        class="handover__badge"
        :class="{ 'handover__badge--muted': row.muted }"
      >
        {{ row.target }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  FlightLeg,
  FlightSeries,
  VehicleGroup,
} from '@/../src-common/entities';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useFlightStore } from '@/stores/flight';
import { computeGroupHandover, type HandoverMove } from '@/util/handover';
import { vehicleGroupLabel } from '@/util/group';

const { flightSeries, flightLeg, group } = defineProps<{
  flightSeries: FlightSeries;
  flightLeg: FlightLeg;
  group: VehicleGroup;
}>();

const flightStore = useFlightStore();
const { personMap } = storeToRefs(flightStore);

type HandoverRow =
  | { kind: 'swap'; outId: string; inId: string; target: string; muted: false }
  | { kind: 'out' | 'in'; personId: string; target: string; muted: boolean };

const groupIndex = computed<number>(() =>
  flightSeries.vehicleGroups.findIndex((g) => g.balloonId === group.balloonId),
);

const rows = computed<HandoverRow[]>(() => {
  if (groupIndex.value === -1) {
    return [];
  }

  const handover = computeGroupHandover(
    flightSeries,
    flightLeg.id,
    groupIndex.value,
  );
  if (!handover) {
    return [];
  }

  const { leaving, joining } = handover;
  const swaps: HandoverRow[] = [];
  const outs: HandoverRow[] = [];
  const ins: HandoverRow[] = [];

  const letter = (m: HandoverMove) =>
    m.otherGroup === null ? null : vehicleGroupLabel(m.otherGroup);

  // Pair a person leaving to group X with a person joining from that same
  // group X — a direct exchange — and render it as a single swap line.
  const pairedJoin = new Set<HandoverMove>();
  for (const out of leaving) {
    const match =
      out.otherGroup === null
        ? undefined
        : joining.find(
            (j) => !pairedJoin.has(j) && j.otherGroup === out.otherGroup,
          );

    if (match) {
      pairedJoin.add(match);
      swaps.push({
        kind: 'swap',
        outId: out.personId,
        inId: match.personId,
        target: letter(out) ?? '',
        muted: false,
      });
    } else {
      outs.push({
        kind: 'out',
        personId: out.personId,
        target: letter(out) ?? 'out',
        muted: out.otherGroup === null,
      });
    }
  }

  for (const j of joining) {
    if (pairedJoin.has(j)) {
      continue;
    }
    ins.push({
      kind: 'in',
      personId: j.personId,
      target: letter(j) ?? 'new',
      muted: j.otherGroup === null,
    });
  }

  return [...swaps, ...outs, ...ins];
});

function personName(personId: string): string {
  return personMap.value[personId]?.name ?? '?';
}
</script>

<style scoped>
/* A small white instruction card that echoes the vehicle tables it sits under,
   so it reads as part of the group without competing with them. Kept static
   and solid-colour only so it survives the html-to-image PNG export. */
.handover {
  margin: 0.35em 0.5em 0.5em;
  padding: 0.4em 0.6em 0.45em;
  max-width: 16em;
  background: #fff;
  border-radius: 8px;
  border-left: 3px solid var(--q-primary, #1976d2);
  font-size: 0.75rem;
  line-height: 1.3;
}

.handover__title {
  display: flex;
  align-items: center;
  gap: 0.3em;
  margin-bottom: 0.35em;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--q-primary, #1976d2);
}

.handover__title-glyph {
  font-size: 0.9rem;
  line-height: 1;
}

.handover__move {
  display: grid;
  grid-template-columns: 1.2em 1fr auto;
  align-items: center;
  column-gap: 0.35em;
  padding: 0.12em 0;
}

/* Swap is the signature line: the pair spans the arrow + name columns so the
   two names read as one exchange, with the group badge aligned right. */
.handover__pair {
  grid-column: 1 / 3;
  display: flex;
  align-items: baseline;
  gap: 0.3em;
  min-width: 0;
}

.handover__swap {
  flex: 0 0 auto;
  color: var(--q-primary, #1976d2);
  font-weight: 700;
}

.handover__dir {
  text-align: center;
  font-weight: 700;
}

.handover__dir--out {
  color: #9e6a00;
}

.handover__dir--in {
  color: #2e7d32;
}

.handover__name {
  overflow-wrap: anywhere;
}

.handover__badge {
  justify-self: end;
  min-width: 1.5em;
  padding: 0.05em 0.4em;
  border-radius: 5px;
  background: var(--q-primary, #1976d2);
  color: #fff;
  font-weight: 700;
  font-size: 0.7rem;
  text-align: center;
  text-transform: uppercase;
  line-height: 1.5;
}

.handover__badge--muted {
  background: #9e9e9e;
}
</style>
