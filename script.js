document.addEventListener('DOMContentLoaded', () => {
    // 1. Definições de Elementos e Constantes
    const findButton = document.getElementById('find-button');
    const statusDiv = document.getElementById('status-message');
    const resultsContainer = document.getElementById('results-container');
    
    // NOVO ENDPOINT: Overpass API
    const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
    const SEARCH_DISTANCE = 5000; // 5000 metros (5km)

    // 2. Registro do Service Worker (Mantido para o PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado com sucesso:', registration.scope);
                })
                .catch(err => {
                    console.error('Falha no registro do Service Worker:', err);
                });
        });
    }

    findButton.addEventListener('click', findPOIs);

    function findPOIs() {
        if (!navigator.geolocation) {
            statusDiv.innerHTML = '<span class="text-danger">Desculpe, a Geolocalização não é suportada pelo seu navegador.</span>';
            return;
        }

        statusDiv.textContent = 'Localizando você... Por favor, conceda permissão.';
        findButton.disabled = true;
        findButton.textContent = 'Buscando...';

        // 3. USO DO HARDWARE: Geolocation API
        navigator.geolocation.getCurrentPosition(success, error, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    }

    function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        statusDiv.textContent = `Sua localização: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}. Buscando serviços públicos próximos...`;

        // 4. Constrói a Overpass QL Query (ATUALIZADO PARA SERVIÇOS PÚBLICOS)
        const overpassQuery = `
[out:json][timeout:25];
(
  // Caixas Eletrônicos (ATM)
  node["amenity"="atm"](around:${SEARCH_DISTANCE}, ${lat}, ${lon});
  // Postos de Gasolina (Fuel)
  node["amenity"="fuel"](around:${SEARCH_DISTANCE}, ${lat}, ${lon});
  // Hospitais
  node["amenity"="hospital"](around:${SEARCH_DISTANCE}, ${lat}, ${lon});
  // Clínicas / Postos de Saúde
  node["amenity"="clinic"](around:${SEARCH_DISTANCE}, ${lat}, ${lon});
  // Delegacias / Polícia
  node["amenity"="police"](around:${SEARCH_DISTANCE}, ${lat}, ${lon});
);
out center;
`;
        // 5. Executa a Busca com a Overpass API (POST Request)
        fetch(OVERPASS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: 'data=' + encodeURIComponent(overpassQuery)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na API Overpass: ${response.status}.`);
            }
            return response.json();
        })
        .then(data => {
            const poiList = data.elements || []; 
            displayOverpassResults(poiList);
        })
        .catch(err => {
            statusDiv.innerHTML = `<span class="text-danger">Erro de Busca: A API Overpass falhou. Status: ${err.message}.</span>`;
            console.error('Overpass Fetch Error:', err);
        })
        .finally(() => {
            findButton.disabled = false;
            findButton.textContent = 'Ativar Localização e Buscar';
        });
    }

    function error(err) {
        let message = '';
        if (err.code === 1) {
            message = 'Acesso à localização NEGADO pelo usuário.';
        } else {
            message = `Erro ao obter localização: ${err.message}`;
        }
        statusDiv.innerHTML = `<span class="text-danger">${message}</span>`;
        findButton.disabled = false;
        findButton.textContent = 'Ativar Localização e Buscar';
    }

    // 6. Função de exibição dos resultados Overpass (LÓGICA ATUALIZADA PARA SERVIÇOS PÚBLICOS)
    function displayOverpassResults(poiList) {
        resultsContainer.innerHTML = '';

        if (poiList.length === 0) {
            resultsContainer.innerHTML = `<p class="alert alert-warning">Nenhum Serviço Público encontrado em um raio de ${SEARCH_DISTANCE / 1000} km.</p>`;
            return;
        }

        statusDiv.textContent = `Sucesso! Encontrados ${poiList.length} Serviços Públicos próximos.`;

        poiList.forEach(poi => {
            if (poi.type !== 'node' && poi.type !== 'way') return; 

            const card = document.createElement('div');
            card.className = 'poi-card';
            
            // Dados brutos do OSM (tags)
            const nome = poi.tags.name || `Local (${(poi.tags.amenity || 'Sem Nome').toUpperCase()})`; 
            
            let categoria = 'Outros Serviços';
            let badgeClass = 'bg-secondary';

            const amenity = poi.tags.amenity;

            // Mapeamento das categorias e cores
            switch (amenity) {
                case 'atm':
                    categoria = 'Caixa Eletrônico (ATM)';
                    badgeClass = 'bg-info';
                    break;
                case 'fuel':
                    categoria = 'Posto de Gasolina';
                    badgeClass = 'bg-warning text-dark';
                    break;
                case 'hospital':
                    categoria = 'Hospital';
                    badgeClass = 'bg-danger';
                    break;
                case 'clinic':
                    categoria = 'Clínica / Posto de Saúde';
                    badgeClass = 'bg-danger';
                    break;
                case 'police':
                    categoria = 'Delegacia / Polícia';
                    badgeClass = 'bg-primary';
                    break;
                default:
                    // Se o POI tiver sido incluído por algum filtro de área (way) que não tem amenity
                    categoria = 'Serviço Público';
                    badgeClass = 'bg-secondary';
            }
            
            const lat = poi.lat || (poi.center ? poi.center.lat : 'N/A');
            const lon = poi.lon || (poi.center ? poi.center.lon : 'N/A');

            const osmLink = (lat !== 'N/A' && lon !== 'N/A') 
                ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`
                : '#';

            card.innerHTML = `
                <h5 class="mb-1">${nome}</h5>
                <p class="mb-1"><span class="badge ${badgeClass}">${categoria}</span></p>
                <small class="text-muted">Coordenadas: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}</small><br>
                <a href="${osmLink}" target="_blank" class="badge bg-primary text-decoration-none mt-2">Ver no OSM</a>
            `;
            resultsContainer.appendChild(card);
        });
    }

});