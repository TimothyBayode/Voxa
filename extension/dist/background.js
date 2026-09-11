"use strict";
(() => {
  // src/background/serviceWorker.ts
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "ping") {
      sendResponse({ ok: true });
    }
    return true;
  });
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "start-dictation") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "start-dictation" }).catch(() => {
        });
      }
    }
  });
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "voxa-dictate",
      title: "Type using Voxa",
      contexts: ["editable"]
    });
  });
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "start-dictation" }, { frameId: info.frameId }).catch(() => {
      });
    }
  });
})();
