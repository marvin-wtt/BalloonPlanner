import { defineStore } from 'pinia';
import { Project } from 'src/lib/entities/Project';
import { ref } from 'vue';
import { Balloon, Car, Flight, Person } from 'src/lib/entities';

export const useProjectStore = defineStore('project', () => {
  const project = ref<Project | null>();
  const error = ref<boolean>(false);

  async function loadProject() {
    // const people: Person[] = [];
    // people.push(new Person('Thomas', 'fr', false));
    // people.push(new Person('Oliver', 'fr'));
    // people.push(new Person('Daniel', 'fr'));
    // people.push(new Person('Ethan', 'fr'));
    // people.push(new Person('Samuel', 'fr', true));
    //
    // people.push(new Person('Sophie', 'fr'));
    // people.push(new Person('Jessica', 'fr'));
    // people.push(new Person('Chloe', 'fr'));
    // people.push(new Person('Ruby', 'fr'));
    // people.push(new Person('Charlotte', 'fr', true));
    //
    // people.push(new Person('Harry', 'de'));
    // people.push(new Person('William', 'de'));
    // people.push(new Person('Joseph', 'de'));
    // people.push(new Person('Leo', 'de'));
    // people.push(new Person('Adam', 'de', true));
    //
    // people.push(new Person('Amelia', 'de'));
    // people.push(new Person('Sophie', 'de'));
    // people.push(new Person('Jessica', 'de'));
    // people.push(new Person('Olivia', 'de'));
    // people.push(new Person('Ella', 'de', true));
    //
    // const balloons: Balloon[] = [];
    // balloons.push(new Balloon('F-OABC', 4, [people[4], people[9]]));
    // balloons.push(new Balloon('D-OABC', 3, [people[14]]));
    //
    // const cars: Car[] = [];
    // cars.push(new Car('M-AA-111', 10, [people[4], people[9]]));
    // cars.push(new Car('F-BB-222', 10, [people[19]]));
    //
    // const flight = new Flight(balloons, cars, people);
    // flight.id = '1';
    //
    // project.value = new Project();
    // project.value.flights.push(flight);
  }

  function createFlight(): string {
    if (!project.value) {
      return '';
    }

    let flight = null;

    if (project.value.flights.length > 0) {
      const lastIndex = project.value?.flights.length - 1;
      const last = project.value?.flights[lastIndex];

      flight = new Flight(last?.balloons, last?.cars, last?.people);
    } else {
      flight = new Flight([], [], []);
    }

    project.value?.flights.push(flight);
    return flight.id;
  }

  return { project, error, loadProject, createFlight };
});
