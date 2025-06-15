const axios = require('axios');
const fs = require('fs');
const path = require('path');

class CurseForgeAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.curseforge.com';
        this.minecraftGameId = 432; // Minecraft game ID
    }

    async makeRequest(endpoint, params = {}) {
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Accept': 'application/json'
                },
                params
            });
            return response.data;
        } catch (error) {
            console.error('API Request failed:', error.message);
            throw error;
        }
    }

    async getMinecraftVersions() {
        try {
            const response = await this.makeRequest('/v1/minecraft/version');
            return response.data;
        } catch (error) {
            console.error('Failed to get Minecraft versions:', error);
            return [];
        }
    }

    async getModLoaders() {
        try {
            const response = await this.makeRequest('/v1/minecraft/modloader');
            return response.data;
        } catch (error) {
            console.error('Failed to get mod loaders:', error);
            return [];
        }
    }

    async searchMods(gameVersion, modLoader, searchFilter = '') {
        try {
            const params = {
                gameId: this.minecraftGameId,
                gameVersion: gameVersion,
                modLoaderType: modLoader,
                searchFilter: searchFilter,
                sortField: 2, // Popularity
                sortOrder: 'desc',
                pageSize: 50
            };

            const response = await this.makeRequest('/v1/mods/search', params);
            return response.data;
        } catch (error) {
            console.error('Failed to search mods:', error);
            return [];
        }
    }

    async getModFiles(modId) {
        try {
            const response = await this.makeRequest(`/v1/mods/${modId}/files`);
            return response.data;
        } catch (error) {
            console.error(`Failed to get files for mod ${modId}:`, error);
            return [];
        }
    }

    async downloadFile(downloadUrl, filePath) {
        try {
            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Failed to download file:', error);
            throw error;
        }
    }
}

module.exports = CurseForgeAPI;

