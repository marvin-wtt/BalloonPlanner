import log from 'electron-log/renderer';
import { defineBoot } from '#q-app/wrappers'; // renderer build

export default defineBoot(({ app }) => {
  // Levels / destinations
  log.transports.console.level = 'debug';

  // Helpful to locate the log file
  Object.assign(console, log.functions);

  // Global error hooks (renderer)
  window.addEventListener('error', (event) => {
    log.error('Renderer uncaught error:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    log.error('Renderer unhandled rejection:', event.reason);
  });

  // Make it easy to use anywhere: this.$log / inject('log')
  app.config.globalProperties.$log = log;
});
