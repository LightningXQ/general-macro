const { contextBridge, ipcRenderer } = require('electron');

// contextBridge를 통해 렌더러(index.html)에 안전한 API를 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 창 제어
    minimizeApp: () => ipcRenderer.send('minimize-app'),
    closeApp: () => ipcRenderer.send('close-app'),

    // 설정 동기화 (렌더러 → 메인)
    updateSettings: (target, type, cps) =>
        ipcRenderer.send('update-settings', { clickTarget: target, clickType: type, cpsValue: cps }),

    // 매크로 시작/중지 (invoke/handle 패턴으로 응답 수신)
    controlMacro: (action) => ipcRenderer.invoke('control-macro', action),

    // 전역 F8 단축키 이벤트 수신 (메인 → 렌더러)
    onF8Pressed: (callback) => ipcRenderer.on('global-f8-pressed', callback),
});
