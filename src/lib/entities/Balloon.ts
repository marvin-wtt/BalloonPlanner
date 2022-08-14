import { Vehicle } from 'src/lib/entities/Vehicle';

export class Balloon extends Vehicle {
  clone(): Balloon {
    const balloon = new Balloon(this.information);
    balloon.passengers = this.passengers.slice();
    balloon.operator = this.operator;
    return balloon;
  }
}
