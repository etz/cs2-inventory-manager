import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "./App";
import { PersistGate } from 'redux-persist/integration/react'
import returnVar from './store/configureStore'

const myVar = returnVar();

window.addEventListener('error', (event) => {
  if (event.message?.includes('Invalid array length') || event.error?.name === 'RangeError') {
    console.error('[RangeError]', event.error?.message ?? event.message, event.filename, event.lineno, event.colno);
  }
});
window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason;
  if (err?.name === 'RangeError' || err?.message?.includes?.('Invalid array length')) {
    console.error('[RangeError unhandled]', err?.message, err?.stack);
  }
});


declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => any;
        set: (key: string, val: any) => void;
        // any other methods you've defined...
      },
      ipcRenderer: any
    }
    
  }
}

render(

  <Provider store={myVar.reduxStore}>
    <PersistGate loading={null} persistor={myVar.persistor}>
     <App />
     </PersistGate>
  </Provider>
, document.getElementById("root"));