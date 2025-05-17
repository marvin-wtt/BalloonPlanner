import type { PersistenceService } from 'src/services/persistence/PersistenceService';
import type { Balloon, Car, Person } from 'src/lib/entities';
import { VehicleGroup } from 'src/lib/entities';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useServiceStore } from 'stores/service';

export function useFlightOperations() {
  const quasar = useQuasar();
  const { t } = useI18n();
  const { dataService } = useServiceStore();

  function monitorService(
    cb: (service: PersistenceService) => Promise<void>,
  ): void {
    if (!dataService) {
      quasar.notify({
        type: 'negative',
        message: t('service_not_available'),
      });
      return;
    }

    const promise = cb(dataService);
    const notify = quasar.notify({
      type: 'ongoing',
      message: t('saving_in_progress'),
    });
    promise
      .then(() => {
        notify({
          type: 'positive',
          message: t('saving_success'),
          timeout: 1000,
        });
      })
      .catch((reason) => {
        notify({
          type: 'warning',
          message: t('saving_failed') + ': ' + reason,
          timeout: 5000,
        });
      });
  }

  function addVehicleGroup(balloon: Balloon) {
    monitorService((service) =>
      service.addVehicleGroup(new VehicleGroup(balloon)),
    );
  }

  function removeVehicleGroup(group: VehicleGroup) {
    monitorService((service) => service.deleteVehicleGroup(group));
  }

  function addCarToVehicleGroup(group: VehicleGroup, car: Car) {
    monitorService((service) => service.addCarToVehicleGroup(car, group));
  }

  function removeCarFromVehicleGroup(group: VehicleGroup, car: Car) {
    monitorService((service) => service.removeCarFromVehicleGroup(car, group));
  }

  function addBalloonOperator(balloon: Balloon, person: Person) {
    monitorService((service) => service.setBalloonOperator(person, balloon));
  }

  function addCarOperator(car: Car, person: Person) {
    monitorService((service) => service.setCarOperator(person, car));
  }

  function removeBalloonOperator(balloon: Balloon) {
    monitorService((service) => service.setBalloonOperator(undefined, balloon));
  }

  function removeCarOperator(car: Car) {
    monitorService((service) => service.setCarOperator(undefined, car));
  }

  function addBalloonPassenger(balloon: Balloon, person: Person) {
    monitorService((service) => service.addBalloonPassenger(person, balloon));
  }

  function addCarPassenger(car: Car, person: Person) {
    monitorService((service) => service.addCarPassenger(person, car));
  }

  function removeBalloonPassenger(balloon: Balloon, person: Person) {
    monitorService((service) =>
      service.removeBalloonPassenger(person, balloon),
    );
  }

  function removeCarPassenger(car: Car, person: Person) {
    monitorService((service) => service.removeCarPassenger(person, car));
  }

  function addPerson(person: Person) {
    monitorService((service) => service.addPerson(person));
  }

  function editPerson(person: Person) {
    monitorService((service) => service.updatePerson(person));
  }

  function removePerson(person: Person) {
    monitorService((service) => service.deletePerson(person));
  }

  function addBalloon(balloon: Balloon) {
    monitorService((service) => service.addBalloon(balloon));
  }

  function editBalloon(balloon: Balloon) {
    monitorService((service) => service.updateBalloon(balloon));
  }

  function removeBalloon(balloon: Balloon) {
    monitorService((service) => service.deleteBalloon(balloon));
  }

  function addCar(car: Car) {
    monitorService((service) => service.addCar(car));
  }

  function editCar(car: Car) {
    monitorService((service) => service.updateCar(car));
  }

  function removeCar(car: Car) {
    monitorService((service) => service.deleteCar(car));
  }

  return {
    addVehicleGroup,
    removeVehicleGroup,
    addCarToVehicleGroup,
    removeCarFromVehicleGroup,
    addBalloonOperator,
    addCarOperator,
    removeBalloonOperator,
    removeCarOperator,
    addBalloonPassenger,
    addCarPassenger,
    removeBalloonPassenger,
    removeCarPassenger,
    addPerson,
    editPerson,
    removePerson,
    addBalloon,
    editBalloon,
    removeBalloon,
    addCar,
    editCar,
    removeCar,
  };
}
