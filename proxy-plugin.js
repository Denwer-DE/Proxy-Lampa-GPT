
(() => {
    const originalFetch = window.fetch;
    const proxyMap = {
        'image.tmdb.org': ['https://138.199.36.8', 'https://89.187.169.39'],
        'api.themoviedb.org': ['https://108.156.46.87', 'https://108.157.4.61']
    };

    function fetchWithTimeout(url, init = {}, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
            originalFetch(url, init)
                .then(response => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    async function tryFetchWithFallback(url, init, hostname) {
        const proxies = proxyMap[hostname];
        for (let i = 0; i < proxies.length; i++) {
            const proxy = proxies[i];
            const proxyUrl = url.replace(`https://${hostname}`, proxy);
            try {
                const response = await fetchWithTimeout(proxyUrl, init);
                if (response.ok) return response;
            } catch (e) {
                console.warn(`Fetch failed for ${proxyUrl}, trying next...`, e.message);
            }
        }
        throw new Error(`All proxy fetch attempts failed for ${hostname}`);
    }

    window.fetch = function(resource, init) {
        if (typeof resource === 'string') {
            if (resource.includes('image.tmdb.org')) {
                return tryFetchWithFallback(resource, init, 'image.tmdb.org');
            }
            if (resource.includes('api.themoviedb.org')) {
                return tryFetchWithFallback(resource, init, 'api.themoviedb.org');
            }
        }
        return originalFetch.call(this, resource, init);
    };

    console.log('TMDB Proxy plugin loaded with fallback and timeout support');
})();
