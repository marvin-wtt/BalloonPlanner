// This is just an example,
// so you can safely delete all default props below

export default {
  allowed_operators: 'Allowed operators',

  balloon: 'Balloon | Balloons',

  cancel: 'Cancel',
  capacity: 'Capacity',
  car: 'Car | Cars',
  create: 'Create',

  dialog: {
    person: {
      title: 'Add a new person',
      name: {
        label: 'Name',
        hint: 'Unique name of the vehicle',
        validation: {
          required: 'Please tyoe an unqiue name',
        },
      },
      nationality: {
        label: 'Nationality',
        validation: {
          type: 'Please select a valid ',
        },
      },
      flights: {
        label: 'Flights',
        hint: 'Number of flights previous to this flight',
      },
      supervisor: {
        label: 'Supervisor',
      },
    },
    vehicle: {
      title: 'Create a new vehicle',
      type: {
        label: 'Type of vehicle',
        validation: {
          required: 'Please select a vehicle type',
        },
      },
      name: {
        label: 'Vehicle name',
        validation: {
          unique: 'Vehicle name must be unique',
          required: 'Vehicle name is required',
        },
      },
      capacity: {
        label: 'Capacity',
        hint: 'Maximum amout of passengers including the operator',
        validation: {
          number: 'Please type a positive number',
        },
      },
      allowed_operators: {
        label: 'Allowed operators',
      },
    },
  },

  drop_here_or_create: 'Drop an item here or create a new one',

  edit: 'Edit',

  flight: 'Flight | Flights',
  french: 'French',

  german: 'German',

  hint_balloon_capacity: 'Amount of passengers without the pilot',

  list_empty: 'There are currently no items in this list',

  name: 'Name',
  nationality: 'Nationality',

  overview: 'Overview',

  person: 'Person | People',

  remove: 'Remvoe',

  success: 'Action was successful',
  supervisor: 'Supervisor',

  tooltip_insufficient_capacity: 'Insufficient seats in car(s)',

  vehicle_type: 'Vehicle type',
};
