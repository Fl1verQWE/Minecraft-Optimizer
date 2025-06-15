const { ipcRenderer } = require('electron');

document.addEventListener("DOMContentLoaded", () => {
    const apiKeyInput = document.getElementById("api-key");
    const setApiKeyButton = document.getElementById("set-api-key-button");
    const minecraftPathInput = document.getElementById("minecraft-path");
    const browseButton = document.getElementById("browse-button");
    const minecraftVersionSelect = document.getElementById("minecraft-version");
    const modLoaderSelect = document.getElementById("mod-loader");
    const optimizeButton = document.getElementById("optimize-button");
    const logArea = document.getElementById("log-area");

    let apiKeySet = false;

    function log(message) {
        const p = document.createElement("p");
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logArea.appendChild(p);
        logArea.scrollTop = logArea.scrollHeight;
    }

    function updateOptimizeButton() {
        const hasPath = minecraftPathInput.value.trim() !== '';
        const hasVersion = minecraftVersionSelect.value !== '';
        const hasLoader = modLoaderSelect.value !== '';
        
        optimizeButton.disabled = !apiKeySet || !hasPath || !hasVersion || !hasLoader;
    }

    // API Key setup
    setApiKeyButton.addEventListener("click", async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            log("Ошибка: Введите API ключ");
            return;
        }

        log("Устанавливаю API ключ...");
        const result = await ipcRenderer.invoke('set-api-key', apiKey);
        
        if (result.success) {
            log("API ключ установлен успешно");
            apiKeySet = true;
            updateOptimizeButton();
        } else {
            log(`Ошибка установки API ключа: ${result.error}`);
        }
    });

    // Browse folder
    browseButton.addEventListener("click", async () => {
        const folderPath = await ipcRenderer.invoke('select-folder');
        if (folderPath) {
            minecraftPathInput.value = folderPath;
            updateOptimizeButton();
        }
    });

    // Update button state when inputs change
    minecraftPathInput.addEventListener('input', updateOptimizeButton);
    minecraftVersionSelect.addEventListener('change', updateOptimizeButton);
    modLoaderSelect.addEventListener('change', updateOptimizeButton);

    // Optimize button
    optimizeButton.addEventListener("click", async () => {
        const minecraftPath = minecraftPathInput.value.trim();
        const gameVersion = minecraftVersionSelect.value;
        const modLoader = modLoaderSelect.value;

        log(`Начинаю оптимизацию для Minecraft ${gameVersion} (${modLoader}) в папке: ${minecraftPath}`);
        
        optimizeButton.disabled = true;
        optimizeButton.textContent = "Оптимизирую...";

        try {
            const result = await ipcRenderer.invoke('optimize-minecraft', {
                minecraftPath,
                gameVersion,
                modLoader
            });

            if (result.success) {
                log("Оптимизация завершена!");
                result.data.forEach(downloadResult => {
                    if (downloadResult.success) {
                        log(`✓ ${downloadResult.mod} скачан успешно`);
                    } else {
                        log(`✗ Ошибка скачивания ${downloadResult.mod}: ${downloadResult.error}`);
                    }
                });
            } else {
                log(`Ошибка оптимизации: ${result.error}`);
            }
        } catch (error) {
            log(`Неожиданная ошибка: ${error.message}`);
        } finally {
            optimizeButton.disabled = false;
            optimizeButton.textContent = "Оптимизировать";
            updateOptimizeButton();
        }
    });

    log("Приложение готово. Введите API ключ CurseForge для начала работы.");
});

