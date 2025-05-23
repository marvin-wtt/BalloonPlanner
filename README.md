# Balloon Organizer

An application to organize hot air balloon crews for youth camps. This tool helps manage balloons, cars, counselors, and participants for balloon flights during youth camp activities.

## Features

- **Balloon Management**: Add, edit, and remove hot air balloons with capacity information
- **Vehicle Management**: Manage cars and their capacity for transporting participants
- **Personnel Management**: Organize counselors and participants
- **Flight Planning**: Create and manage balloon flights with automatic crew assignment
- **Optimization**: Uses Python algorithms to optimize vehicle and balloon assignments
- **Cross-platform**: Works on Windows, macOS, and Linux

## Technology Stack

- **Frontend**: Vue 3, Quasar Framework
- **State Management**: Pinia
- **Desktop Application**: Electron
- **Backend Algorithms**: Python
- **Data Storage**: Electron Store (local file-based storage)

## Installation

### Prerequisites

- Node.js (v22 or later)
- npm (v6.13.4 or later)
- Python (for the optimization algorithms)

### Setup

#### Linux/macOS
```shell
# Install Python environment
./scripts/install-python-env.sh

# Install Node dependencies
npm install

# Start development server
npm run dev
```

#### Windows
```powershell
# Install Python environment
.\scripts\install-python-env.bat

# Install Node dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. **Create Resources**: Add balloons, cars, counselors, and participants
2. **Plan Flights**: Create flight events and assign resources
3. **Optimize Assignments**: Use the built-in algorithms to optimize vehicle and balloon assignments
4. **Export/Import**: Save and load your flight plans

## Building for Production

```bash
npm run build
```

This will create distributable packages for your platform in the `dist` directory.

## Development

- `npm run dev` - Start the development server
- `npm run lint` - Run linting
- `npm run format` - Format code using Prettier

## License

This project is maintained by [marvin-wtt](https://github.com/marvin-wtt).
