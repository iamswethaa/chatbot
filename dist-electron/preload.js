"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    saveConfigFiles: async (files) => {
        return await electron_1.ipcRenderer.invoke("save-config-files", files);
    },
    runFCTCommands: async (speakerCount, ambientTemperature, storageType) => {
        return await electron_1.ipcRenderer.invoke("run-fct-commands", speakerCount, ambientTemperature, storageType);
    },
    clearConfigFolder: async () => {
        return await electron_1.ipcRenderer.invoke("clear-config-folder");
    },
    // Chat functionality
    chat: {
        createSession: async (userId) => {
            return await electron_1.ipcRenderer.invoke("chat:create-session", userId);
        },
        sendMessage: async (message, sessionId, options) => {
            return await electron_1.ipcRenderer.invoke("chat:send-message", message, sessionId, options);
        },
        streamMessage: async (message, sessionId, options) => {
            return await electron_1.ipcRenderer.invoke("chat:stream-message", message, sessionId, options);
        },
        getSession: async (sessionId) => {
            return await electron_1.ipcRenderer.invoke("chat:get-session", sessionId);
        },
        deleteSession: async (sessionId) => {
            return await electron_1.ipcRenderer.invoke("chat:delete-session", sessionId);
        },
        getServiceStatus: async () => {
            return await electron_1.ipcRenderer.invoke("chat:get-service-status");
        }
    }
});
