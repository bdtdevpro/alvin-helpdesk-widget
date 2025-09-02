import { __rest } from "tslib";
import React from 'react';
import ReactDOM from 'react-dom';
import { ChatWidget } from './components/chat-widget';
window.initAlvinHelpdesk = (opts) => {
    const { containerId } = opts, rest = __rest(opts, ["containerId"]);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found.`);
        return;
    }
    ReactDOM.render(<ChatWidget {...rest}/>, container);
};
//# sourceMappingURL=embed.jsx.map