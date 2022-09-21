<template>
  <q-dialog v-model="visable">
    <q-card>
      <q-form @reset="onReset" @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="text-h6">{{ $t('dialog_edit_vehicle_title') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-select
            v-if="type === undefined"
            v-model="vehicleType"
            :options="vehicleTypes"
            :label="$t('vehicle_type')"
            :rules="[
              (val) =>
                (val && vehicleTypes.map(val => val.value).includes(val)) ||
                $t('dialog_edit_vehicle_validation_type'),
            ]"
            emit-value
            map-options
            filled
          />

          <!-- TODO unique rule -->
          <q-input
            v-model="name"
            :label="$t('name')"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.length > 0) ||
                $t('dialog_edit_vehicle_validation_name_required'),
            ]"
            filled
          />

          <q-input
            v-model.number="capacity"
            type="number"
            :label="$t('capacity')"
            :hint="$t('dialog_edit_vehicle_hint_capacity')"
            lazy-rules
            :rules="[
              (val) =>
                (val !== null && val !== '' && val > 0) ||
                $t('dialog_edit_vehicle_validation_capacty'),
            ]"
            filled
          />

          <q-select
            v-model="allowedOperators"
            :label="$t('allowed_operators')"
            use-input
            use-chips
            multiple
            input-debounce="0"
            :options="filterOptions"
            @filter="filterFn"
            style="width: 250px"
            emit-value
            map-options
            filled
          />
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn
            type="reset"
            color="primary"
            :label="$t('cancel')"
            v-close-popup
            flat
          />
          <q-btn type="submit" color="primary" :label="$t('create')" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Balloon, Car, Person, Vehicle } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  modelValue: boolean;
  people: Person[];
  vehicle?: Vehicle;
  vehicles?: Vehicle[];
  type?: 'balloon' | 'car';
}

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:vehicle', value: Vehicle): void;
  (e: 'update:vehicles', value: Vehicle[]): void;
}>();

const name = ref();
const capacity = ref();
const allowedOperators = ref([]);

const filterOptions = ref();
const vehicleType = ref(props.type);
const vehicleTypes = [
  {
    label: t('balloon'),
    value: 'balloon',
  },
  {
    label: t('car'),
    value: 'car',
  },
];

const visable = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const vehicle = computed({
  get() {
    return props.vehicle;
  },
  set(value) {
    if (value) {
      emit('update:vehicle', value);
    }
  },
});

const vehicles = computed({
  get() {
    return props.vehicles;
  },
  set(value) {
    if (value) {
      emit('update:vehicles', value);
    }
  },
});

function onSubmit() {
  if (!vehicle.value && !vehicles.value) {
    // TODO error
    return;
  }

  if (vehicle.value) {
    vehicle.value.name = name.value;
    vehicle.value.capacity = capacity.value;
    vehicle.value.allowedOperators = allowedOperators.value;
  } else if (vehicles.value) {
    // Create new vehicle
    if (!vehicleType.value) {
      return;
    }

    let vehicle: Vehicle;
    if (props.type === 'balloon') {
      vehicle = new Balloon(name.value, capacity.value, allowedOperators.value);
    } else {
      vehicle = new Car(name.value, capacity.value, allowedOperators.value);
    }

    vehicles.value.push(vehicle);
  }

  visable.value = false;
}

function onReset() {
  name.value = null;
  capacity.value = null;
  allowedOperators.value = [];
}

function filterFn(val: string, update: (a: () => void) => void) {
  update(() => {
    let filter: Person[];
    if (val === '') {
      filter = props.people;
    } else {
      const needle = val.toLowerCase();
      filter = props.people.filter(
        (v) => v.name.toLowerCase().indexOf(needle) > -1
      );
    }

    filter.sort((a, b) => a.name.localeCompare(b.name));
    filter.sort((a, b) =>
      a.supervisor == b.supervisor ? 0 : a.supervisor ? -1 : 1
    );

    filterOptions.value = filter.map((value) => {
      return {
        label: value.name,
        value: value,
      }
    });
  });
}
</script>

<style scoped></style>