import React from 'react';
import ReactDOM from 'react-dom';
import { ChatWidget } from './components/chat-widget';

declare global {
  interface Window {
    initAlvinHelpdesk: (opts: { containerId: string; [key: string]: any }) => void;
  }
}

window.initAlvinHelpdesk = (opts) => {
  const { containerId, ...rest } = opts;
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found.`);
    return;
  }
  ReactDOM.render(<ChatWidget isEmbedded {...rest} />, container);
};
