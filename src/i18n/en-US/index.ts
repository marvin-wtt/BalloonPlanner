// This is just an example,
// so you can safely delete all default props below

export default {
  actions: {
    add_balloon: 'Add balloon',
    add_car: 'Add car',
    smart_fill: 'Smart fillup',
  },
  allowed_operators: 'Allowed operators',
  app_name: 'Balloon Organizer',

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
      delete: {
        confirm: {
          title: 'Delete person',
          message:
            'Are you sure you want to delete  "{name}" permanently from this flight? All records will be removed.',
          delete: 'Delete',
          cancel: 'Cancel',
        },
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
      delete: {
        confirm: {
          title: 'Delete vehicle from flight',
          message: 'Are you sure you want to delete  "{name}"?',
          delete: 'Delete',
          cancel: 'Cancel',
        },
      },
    },
  },

  list: {
    item: {
      create: 'Create new {name}',
    },
    empty: {
      label: 'There are currently no {name} in this list',
      caption: 'Drop a {name} here or create a new one',
    },
  },

  login: {
    validation: {
      email: {
        required: 'Please enter an email address',
        type: 'Please enter a valid email address',
      },
      password: {
        required: 'Please enter a password',
      },
    },
  },

  edit: 'Edit',

  flight: 'Flight | Flights',
  french: 'French',

  german: 'German',

  hint_balloon_capacity: 'Amount of passengers without the pilot',

  name: 'Name',
  nationality: 'Nationality',

  overview: 'Overview',

  participant: 'Participant | Participants',

  person: 'Person | People',
  pilot_index: 'P',

  remove: 'Remvoe',

  settings: 'Settings',
  success: 'Action was successful',
  supervisor: 'Counselor | Counselors',

  tooltip_insufficient_capacity: 'Insufficient seats in car(s)',

  vehicle_type: 'Vehicle type',
};
