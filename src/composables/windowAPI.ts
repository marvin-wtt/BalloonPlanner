export function minimize() {
  if (process.env.MODE === 'electron') {
    window.windowAPI.minimize();
  }
}

export function toggleMaximize() {
  if (process.env.MODE === 'electron') {
    window.windowAPI.toggleMaximize();
  }
}

export function closeApp() {
  if (process.env.MODE === 'electron') {
    window.windowAPI.close();
  }
}