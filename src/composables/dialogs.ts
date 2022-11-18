import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { Balloon, Car, Flight, Person, Vehicle } from 'src/lib/entities';
import { QVueGlobals } from 'quasar';
import EditVehicleDialog from 'components/dialog/EditVehicleDialog.vue';
import { ComposerTranslation } from 'vue-i18n';
import { PersistenceService } from 'src/services/persistence/PersistenceService';
import { useProjectStore } from 'stores/project';
import { Ref } from 'vue';
import { storeToRefs } from 'pinia';

export function useDialogs(
  $q: QVueGlobals,
  t: ComposerTranslation
) {
  const projectStore = useProjectStore();
  const { service }: { service: Ref<PersistenceService | null> } = storeToRefs(
    projectStore
  ) as any;


  function showCreatePerson() {
    $q.dialog({
      component: EditPersonDialog,
      componentProps: {
        mode: 'create',
      },
    }).onOk((payload) => {
      const person = new Person(
        payload.name,
        payload.nation,
        payload.supervisor,
        payload.flights
      );
      service.value!.addPersom(person);
    });
  }

  function showEditPerson(person: Person) {
    const projectStore = useProjectStore();
    const { service }: { service: Ref<PersistenceService | null> } = storeToRefs(
      projectStore
    ) as any;

    $q.dialog({
      component: EditPersonDialog,
      componentProps: {
        person: person,
        mode: 'edit',
      },
    }).onOk((payload) => {
      const p = new Person(
        payload.name,
        payload.nation,
        payload.supervisor,
        payload.flights
      );
      p.id = person.id;
      service.value!.updatePersom(p);
    });
  }

  function showDeletePerson(person: Person) {
    $q.dialog({
      title: t('dialog.person.delete.confirm.title'),
      message: t('dialog.person.delete.confirm.message', { name: person.name }),
      ok: {
        label: t('delete'),
        color: 'negative',
      },
      cancel: {
        label: t('cancel'),
        outline: true,
        color: 'grey',
      },
      persistent: true,
    }).onOk(() => {
      service.value!.deletePersom(person);
    });
  }

  function showEditVehicle(vehicle: Vehicle, flight: Flight) {
    $q.dialog({
      component: EditVehicleDialog,
      componentProps: {
        type: vehicle instanceof Balloon ? 'balloon' : 'car',
        vehicle: vehicle,
        people: flight.people,
      },
    }).onOk((payload) => {
      if (vehicle instanceof Balloon) {
        const balloon = new Balloon(
          payload.name,
          payload.capacity,
          payload.allowedOperators
        );
        balloon.id = vehicle.id;
        balloon.operator = vehicle.operator;
        balloon.passengers = vehicle.passengers;
        service.value!.updateBalloon(balloon);
      } else if (vehicle instanceof Car) {
        const car = new Car(
          payload.name,
          payload.capacity,
          payload.allowedOperators
        );
        car.id = vehicle.id;
        car.operator = vehicle.operator;
        car.passengers = vehicle.passengers;
        car.reservedCapacity = vehicle.reservedCapacity;
        service.value!.updateCar(car);
      }
    });
  }

  function showCreateVehicle(type: 'balloon' | 'car', flight: Flight) {
    $q.dialog({
      component: EditVehicleDialog,
      componentProps: {
        type: type,
        people: flight.people,
      },
    }).onOk((payload) => {
      if (type === 'balloon') {
        const balloon = new Balloon(
          payload.name,
          payload.capacity,
          payload.allowedOperators
        );
        service.value!.addBalloon(balloon);
      }

      if (type === 'car') {
        const car = new Car(
          payload.name,
          payload.capacity,
          payload.allowedOperators
        );
        service.value!.addCar(car);
      }
    });
  }

  function showDeleteVehicle(vehicle: Vehicle) {
    $q.dialog({
      title: t('dialog.vehicle.delete.confirm.title'),
      message: t('dialog.vehicle.delete.confirm.message', {
        name: vehicle.name,
      }),
      ok: {
        label: t('delete'),
        color: 'negative',
      },
      cancel: {
        label: t('cancel'),
        outline: true,
        color: 'grey',
      },
      persistent: true,
    }).onOk(() => {
      if (vehicle instanceof Balloon) {
        service.value!.deleteBalloon(vehicle);
      } else if (vehicle instanceof Car) {
        service.value!.deleteCar(vehicle);
      }
    });
  }

  return {
    showCreatePerson,
    showEditPerson,
    showDeletePerson,
    showEditVehicle,
    showCreateVehicle,
    showDeleteVehicle,
  };
}
