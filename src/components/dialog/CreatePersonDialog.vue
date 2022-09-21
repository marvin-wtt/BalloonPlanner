<template>
  <q-dialog v-model="visable">
    <q-card>
      <q-form @reset="onReset" @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="text-h6">{{ $t('dialog_edit_person_title') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- TODO unique rule -->
          <q-input
            v-model="name"
            :label="$t('name')"
            lazy-rules
            :rules="[
              (val) =>
                (val && val.length > 0) ||
                $t('dialog_edit_person_validation_name_required'),
            ]"
            filled
          />

          <q-input
            v-model.number="numberOfFlights"
            type="number"
            :label="$t('flights')"
            :hint="$t('dialog_edit_person_hint_flights')"
            lazy-rules
            :rules="[
              (val) =>
                (val !== null && val !== '' && val >= 0) ||
                $t('dialog_edit_vehicle_validation_capacty'),
            ]"
            filled
          />

          <q-select
            v-model="nation"
            :options="nations"
            :label="$t('nationality')"
            :rules="[
              (val) =>
                (val && nations.map(val => val.value).includes(val)) ||
                $t('dialog_edit_vehicle_validation_type'),
            ]"
            emit-value
            map-options
            filled
          />

          <q-checkbox
            v-model="supervisor"
            :label="$t('supervisor')"
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
          <q-btn type="submit" color="primary" :label="$t('create')"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Balloon, Car, Person, Vehicle } from 'src/lib/entities';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();

interface Props {
  modelValue: boolean;
  people?: Person[];
  person?: Person;
}

const props = withDefaults(defineProps<Props>(), {});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:person', value: Person): void;
  (e: 'update:people', value: Person[]): void;
}>();

const name = ref();
const numberOfFlights = ref(0);
const supervisor = ref(false);

const nation = ref();
const nations = [
  {
    label: t('german'),
    value: 'de',
  },
  {
    label: t('france'),
    value: 'fr',
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

const person = computed({
  get() {
    return props.person;
  },
  set(value) {
    if (value) {
      emit('update:person', value);
    }
  },
});

const people = computed({
  get() {
    return props.people;
  },
  set(value) {
    if (value) {
      emit('update:people', value);
    }
  },
});

function onSubmit() {
  if (!person.value && !people.value) {
    // TODO error
    return;
  }

  if (person.value) {
    person.value.name = name.value;
    person.value.nation = nation.value;
    person.value.numberOfFlights = numberOfFlights.value;
    person.value.supervisor = supervisor.value;
  } else if (people.value) {
    // Create new vehicle
    const person = new Person(name.value, nation.value, supervisor.value, numberOfFlights.value);
    people.value.push(person);
  }

  visable.value = false;
}

function onReset() {
  name.value = null;
  nation.value = null;
  numberOfFlights.value = 0;
  supervisor.value = false;
}

</script>

<style scoped></style>