// NOVO CORS PROXY: Trocado de allorigins.win para corsproxy.io, que tende a ser mais estável.
const CORS_PROXY = 'https://corsproxy.io/?';

function searchSongs(searchTerm) {
    $('#results-container').empty();

    if (!searchTerm) {
        $('#results-container').html('<p class="error-text">Por favor, digite um termo para buscar.</p>');
        return;
    }

    $('#results-container').html('<p class="status-text">Buscando...</p>');

    // 1. URL da API do iTunes a ser buscada
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song`;
    
    // 2. URL completa, codificando a URL de destino para o novo proxy
    const url = `${CORS_PROXY}${encodeURIComponent(itunesUrl)}`;

    $.ajax({
        url: url,
        method: "GET",
        // jQuery tentará parsear a resposta como JSON automaticamente, 
        // eliminando a necessidade do try/catch manual do JSON.parse.
        dataType: 'json', 
        
        success: function(data) {
            // 'data' já é o objeto JSON.
            if (data && data.results && data.results.length === 0) {
                $('#results-container').html('<p class="error-text">Nenhum resultado encontrado. Tente outra busca.</p>');
            } else if (data && data.results) {
                renderResults(data.results);
            } else {
                 // Erro se a estrutura for inesperada (o que raramente acontece com dataType: 'json')
                 $('#results-container').html('<p class="error-text">Erro: Resposta da API inesperada. (Tente buscar novamente).</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Falha na busca:', error);
            // Esta mensagem de erro agora cobre falhas de rede e problemas no proxy
            $('#results-container').html('<p class="error-text">Não foi possível realizar a busca. Verifique sua conexão ou a estabilidade do servidor.</p>');
        }
    });
}

function renderResults(results) {
    $('#results-container').empty();

    const groupedByGenre = results.reduce((acc, item) => {
        const genre = item.primaryGenreName || 'Outro';
        if (!acc[genre]) {
            acc[genre] = [];
        }
        acc[genre].push(item);
        return acc;
    }, {});

    for (const genre in groupedByGenre) {
        const genreContainer = $('<div>').addClass('mb-4');
        const genreTitle = $('<h2>').addClass('text-left text-muted mb-3').text(genre);
        const musicGrid = $('<div>').addClass('results-grid');

        groupedByGenre[genre].forEach(item => {
            const releaseYear = new Date(item.releaseDate).getFullYear();
            const musicCard = $('<div>').addClass('music-card').html(`
                <img src="${item.artworkUrl100}" alt="Capa da música" class="album-image">
                <p class="font-weight-bold text-sm leading-tight mt-2">${item.trackName}</p>
                <p class="text-muted text-xs">${item.artistName}</p>
                <p class="text-muted text-xs">Ano: ${releaseYear}</p>
            `);
            musicGrid.append(musicCard);
        });

        genreContainer.append(genreTitle).append(musicGrid);
        $('#results-container').append(genreContainer);
    }
}