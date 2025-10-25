const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function searchSongs(searchTerm) {
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
            let data;
            
            // Tenta parsear a resposta. 
            // O proxy allorigins.win retorna o JSON como uma string de texto, exigindo o parse.
            try {
                data = JSON.parse(response); 
            } catch (e) {
                 // Captura o erro se o proxy retornar algo que não seja JSON (ex: HTML de erro)
                 console.error('Falha ao parsear JSON:', e);
                 // Mensagem mais específica
                 $('#results-container').html('<p class="error-text">Erro ao processar os dados da busca. (Possível instabilidade no proxy CORS).</p>');
                 return;
            }

            // Continua o processamento se o parse foi bem-sucedido
            if (data.results && data.results.length === 0) {
                $('#results-container').html('<p class="error-text">Nenhum resultado encontrado. Tente outra busca.</p>');
            } else if (data.results) {
                renderResults(data.results);
            } else {
                 // Caso a estrutura da resposta (data.results) seja inesperada.
                 $('#results-container').html('<p class="error-text">Erro: Resposta da API inesperada.</p>');
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