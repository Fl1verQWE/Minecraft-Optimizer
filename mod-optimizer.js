const fs = require('fs');
const path = require('path');

// Список популярных оптимизационных модов для Minecraft
const OPTIMIZATION_MODS = {
    fabric: [
        {
            name: 'Fabric API',
            slug: 'fabric-api',
            description: 'Основная библиотека для Fabric модов'
        },
        {
            name: 'Sodium',
            slug: 'sodium',
            description: 'Мод для оптимизации рендеринга'
        },
        {
            name: 'Lithium',
            slug: 'lithium',
            description: 'Оптимизация серверной части игры'
        },
        {
            name: 'Phosphor',
            slug: 'phosphor',
            description: 'Оптимизация освещения'
        },
        {
            name: 'Iris Shaders',
            slug: 'irisshaders',
            description: 'Поддержка шейдеров для Fabric'
        }
    ],
    forge: [
        {
            name: 'OptiFine',
            slug: 'optifine',
            description: 'Популярный мод для оптимизации и улучшения графики'
        },
        {
            name: 'JEI (Just Enough Items)',
            slug: 'jei',
            description: 'Просмотр рецептов и предметов'
        },
        {
            name: 'JourneyMap',
            slug: 'journeymap',
            description: 'Мини-карта и карта мира'
        },
        {
            name: 'Iron Chests',
            slug: 'iron-chests',
            description: 'Дополнительные типы сундуков'
        }
    ]
};

class ModOptimizer {
    constructor(curseForgeAPI) {
        this.api = curseForgeAPI;
    }

    getOptimizationMods(modLoader) {
        const loader = modLoader.toLowerCase();
        if (loader.includes('fabric')) {
            return OPTIMIZATION_MODS.fabric;
        } else if (loader.includes('forge')) {
            return OPTIMIZATION_MODS.forge;
        }
        return [];
    }

    async findCompatibleMods(gameVersion, modLoader) {
        const optimizationMods = this.getOptimizationMods(modLoader);
        const compatibleMods = [];

        for (const modInfo of optimizationMods) {
            try {
                console.log(`Searching for mod: ${modInfo.name}`);
                const searchResults = await this.api.searchMods(gameVersion, modLoader, modInfo.slug);
                
                if (searchResults && searchResults.length > 0) {
                    const mod = searchResults[0]; // Берем первый результат
                    const files = await this.api.getModFiles(mod.id);
                    
                    // Ищем файл, совместимый с нужной версией
                    const compatibleFile = files.find(file => 
                        file.gameVersions.includes(gameVersion)
                    );

                    if (compatibleFile) {
                        compatibleMods.push({
                            ...modInfo,
                            modId: mod.id,
                            file: compatibleFile,
                            downloadUrl: compatibleFile.downloadUrl
                        });
                    }
                }
            } catch (error) {
                console.error(`Error finding mod ${modInfo.name}:`, error);
            }
        }

        return compatibleMods;
    }

    async downloadMods(mods, minecraftPath) {
        const modsPath = path.join(minecraftPath, 'mods');
        
        // Создаем папку mods если её нет
        if (!fs.existsSync(modsPath)) {
            fs.mkdirSync(modsPath, { recursive: true });
        }

        const downloadPromises = mods.map(async (mod) => {
            try {
                const fileName = mod.file.fileName;
                const filePath = path.join(modsPath, fileName);
                
                console.log(`Downloading ${mod.name}...`);
                await this.api.downloadFile(mod.downloadUrl, filePath);
                console.log(`Downloaded ${mod.name} successfully`);
                
                return { success: true, mod: mod.name };
            } catch (error) {
                console.error(`Failed to download ${mod.name}:`, error);
                return { success: false, mod: mod.name, error: error.message };
            }
        });

        return await Promise.all(downloadPromises);
    }
}

module.exports = { ModOptimizer, OPTIMIZATION_MODS };

