const { app } = require('electron');

console.log('Minimal Electron app: app object is', app);

app.whenReady().then(() => {
  console.log('Minimal Electron app: app is ready.');
  app.quit(); // Quit immediately after ready for testing purposes
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});