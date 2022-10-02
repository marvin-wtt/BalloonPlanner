import EditPersonDialog from 'components/dialog/EditPersonDialog.vue';
import { Balloon, Car, Flight, Person, Vehicle } from 'src/lib/entities';
import { QVueGlobals } from 'quasar';
import EditVehicleDialog from 'components/dialog/EditVehicleDialog.vue';


export function useDialogs($q: QVueGlobals) {

    function showCreatePerson(people: Person[]) {
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
            people.push(person);
        });
    }

    function showEditPerson(person: Person) {
        $q.dialog({
            component: EditPersonDialog,
            componentProps: {
                person: person,
                mode: 'edit',
            },
        }).onOk((payload) => {
            person.name = payload.name;
            person.nation = payload.nation;
            person.numberOfFlights = payload.flights;
            person.supervisor = payload.supervisor;
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
            vehicle.name = payload.name;
            vehicle.capacity = payload.capacity;
            vehicle.allowedOperators = payload.allowedOperators;
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
                flight.balloons.push(balloon);
            }

            if (type === 'car') {
                const car = new Car(
                    payload.name,
                    payload.capacity,
                    payload.allowedOperators
                );
                flight.cars.push(car);
            }
        });
    }

    return {
        showCreatePerson,
        showEditPerson,
        showEditVehicle,
        showCreateVehicle
    }

}