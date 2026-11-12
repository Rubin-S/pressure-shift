import React from 'react';
import ReactDOM from 'react-dom/client';

export const App = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#00d2ff' }}>
      <h1>PRESSURE SHIFT</h1>
      <p>Underwater Social Deduction</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
