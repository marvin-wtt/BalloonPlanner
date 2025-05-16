# Balloon Organizer (balloon-organizer)

An application to organize hot air balloon crews for youth camps

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev -m electron
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.ts](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

## Structure

### Project

A project is a collection of multiple flights.
A project has collaborators who can edit all flights.
When a new flight is created, the amount of flights is copied from the last flight.

### Flight

### Vehicle Group

A vehicle group describes the combination of one balloon and multiple cars which will chase this balloon.

### Balloon

| Field             | Type     | Descirption                                          | Example |
| ----------------- | -------- | ---------------------------------------------------- | ------- |
| Name              | string   | A unique meaningfull identification of the balloon.  | D-OABC  |
| Capacity          | number   | The amount of maximum passengers excluding the pilot | 3       |
| Allowed Operators | Person[] | A list of people who are allowed to fly this balloon |         |
| Operator          | Person   | The pilot which is asigned to this balloon           |         |
| Passengers        | Person[] | A list of passengers who fly with this balloon       |         |

### Car

| Field             | Type     | Descirption                                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------------- |
| Name              | string   | A unique meaningfull identification of the car.                                 |
| Capacity          | number   | The amount of maximum passengers excluding the pilot                            |
| Allowed Operators | Person[] | A list of people who are allowed to drive this car                              |
| Operator          | Person   | The driver who is asigned to this car                                           |
| Passengers        | Person[] | A list of passengers who drive with this car                                    |
| Reserved Capacity | number   | The amount of passengers which are blocked for balloon passengers and the pilot |

## Solver

The solver is an algorithm which tries to find an optimal solution for a flight.
NOTE: The solver only searches for one solution.
There might be other solutions which are evaluated the same.

### Group structure

- Each balloon must have an operator.
- Each group must have enough cars to carry all balloon passengers and the operator.
- Each car must have an operator.
- [Optional] Each crew of a group is evenly distributed.
- Minimize the amount of needed cars.

### Balloon passengers

Balloon passengers are selegted after the following order:

1. Participants, who never flew in a hot air balloon before.
2. Participants, who never flew in this project before.
3. [Optional] Teamer, who never flew before.
4. [Optional] Teamer, who never flew in this project before.
5. Participants with frewest amount of flights.

All possible passengers in the same category are chosen randomly.
