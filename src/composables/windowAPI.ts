export function minimize() {
  if (import.meta.env.QUASAR_MODE === 'electron') {
    window.windowAPI.minimize();
  }
}

export function toggleMaximize() {
  if (import.meta.env.QUASAR_MODE === 'electron') {
    window.windowAPI.toggleMaximize();
  }
}

export function closeApp() {
  if (import.meta.env.QUASAR_MODE === 'electron') {
    window.windowAPI.close();
  }
}
