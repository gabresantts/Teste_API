const CACHE_NAME = 'poi-finder-v1';
const urlsToCache = [
    '/',
    '/index.html',
    // Arquivos locais (AGORA OBRIGATÓRIOS no cache)
    '/style.css', 
    '/script.js', 
    '/manifest.json',
    // Caminhos para os ícones (necessários para o manifesto offline)
    './icon/icon-196.png',
    './icon/icon-512.png',
    
    // Recursos externos do Bootstrap (opcional, mas recomendado)
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
];

// O restante da sua lógica (install, activate, fetch) está perfeita.
// ...