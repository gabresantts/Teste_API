const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function searchSongs(searchTerm) {
    // Usando jQuery para manipular o DOM
    $('#results-container').empty();

    if (!searchTerm) {
        $('#results-container').html('<p class="error-text">Por favor, digite um termo para buscar.</p>');
        return;
    }

    $('#results-container').html('<p class="status-text">Buscando...</p>');

    const url = `${CORS_PROXY}https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song`;

    $.ajax({
        url: url,
        method: "GET",
        success: function(response) {
            try {
                // A resposta bruta do allorigins é uma string que precisa ser parseada
                const data = JSON.parse(response);
                if (data.results.length === 0) {
                    $('#results-container').html('<p class="error-text">Nenhum resultado encontrado. Tente outra busca.</p>');
                } else {
                    renderResults(data.results);
                }
            } catch (e) {
                $('#results-container').html('<p class="error-text">Erro ao processar os dados da busca.</p>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Falha na busca:', error);
            $('#results-container').html('<p class="error-text">Não foi possível realizar a busca. Verifique sua conexão.</p>');
        }
    });
}

function renderResults(results) {
    $('#results-container').empty();

    // Agrupa os resultados por gênero
    const groupedByGenre = results.reduce((acc, item) => {
        const genre = item.primaryGenreName || 'Outro';
        if (!acc[genre]) {
            acc[genre] = [];
        }
        acc[genre].push(item);
        return acc;
    }, {});

    // Renderiza cada grupo de gênero
    for (const genre in groupedByGenre) {
        const genreContainer = $('<div>').addClass('mb-4');
        const genreTitle = $('<h2>').addClass('text-left text-muted mb-3').text(genre);
        const musicGrid = $('<div>').addClass('results-grid');

        groupedByGenre[genre].forEach(item => {
            const releaseYear = new Date(item.releaseDate).getFullYear();
            // Cria o card da música com os dados
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