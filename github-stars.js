/* Shared GitHub star counter for homepage and calculator pages. */
(async () => {
    const starNodes = document.querySelectorAll('.gh-star-count');
    if (!starNodes.length) {
        return;
    }

    const REPO = 'robajzsek-a11y/Investing-Calculator';
    const CACHE_KEY = 'finance-calculators:github-stars';
    const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

    const applyLabel = (label) => {
        if (!label) {
            return;
        }
        starNodes.forEach((node) => {
            node.textContent = label;
        });
    };

    const formatStars = (count) => {
        if (!Number.isFinite(count) || count < 0) {
            return null;
        }
        return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
    };

    const readCachedLabel = () => {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.label !== 'string' || typeof parsed.savedAt !== 'number') {
                return null;
            }

            if (Date.now() - parsed.savedAt > CACHE_TTL_MS) {
                return null;
            }

            return parsed.label;
        } catch (_) {
            return null;
        }
    };

    const writeCachedLabel = (label) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                label,
                savedAt: Date.now()
            }));
        } catch (_) {
            /* Ignore storage failures and keep rendering. */
        }
    };

    const fetchFromGitHubApi = async () => {
        const response = await fetch(`https://api.github.com/repos/${REPO}`, {
            cache: 'no-store',
            headers: {
                Accept: 'application/vnd.github+json'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = await response.json();
        return formatStars(data.stargazers_count);
    };

    const fetchFromShieldsBadge = async () => {
        const response = await fetch(
            `https://img.shields.io/github/stars/${REPO}?style=flat&label=stars&logo=github`,
            { cache: 'no-store' }
        );

        if (!response.ok) {
            throw new Error(`Shields badge returned ${response.status}`);
        }

        const svg = await response.text();
        const textMatches = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)]
            .map((match) => match[1].trim())
            .filter(Boolean);

        const label = [...textMatches].reverse().find((text) => /^[0-9.]+k?$/i.test(text));
        if (!label) {
            throw new Error('Could not parse Shields badge response');
        }

        return label;
    };

    applyLabel(readCachedLabel() || '...');

    try {
        const label = await fetchFromGitHubApi();
        if (label) {
            applyLabel(label);
            writeCachedLabel(label);
            return;
        }
    } catch (_) {
        /* Fall through to the public badge endpoint. */
    }

    try {
        const fallbackLabel = await fetchFromShieldsBadge();
        if (fallbackLabel) {
            applyLabel(fallbackLabel);
            writeCachedLabel(fallbackLabel);
        }
    } catch (_) {
        /* Keep the cached or placeholder label if both requests fail. */
    }
})();
