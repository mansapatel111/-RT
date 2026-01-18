// utils/getWikiData.ts

export interface WikiData {
  title: string;
  summary: string;
  thumbnail: string | null;
  wikiUrl: string | null;
  artist?: string | null;
  isArtPiece?: boolean;
  wikidataId?: string | null;
}

/**
 * Fetches summary, image, and article link for a given title from Wikipedia.
 * 
 * @param title - The title of the article to fetch (e.g., "Mona Lisa")
 * @param lang - The language code (default: "en")
 * @returns A WikiData object or null if not found
 */
export async function getWikiData(
  title: string,
  lang: string = 'en',
  artist?: string | null,
): Promise<WikiData | null> {
  try {
    if (!title) throw new Error("Title is required");

    // Ensure fetch exists (Node <18 doesn't provide global fetch). Dynamically import node-fetch when needed.
    if (typeof globalThis.fetch !== 'function') {
      try {
        // Dynamically import node-fetch without requiring compile-time types
        const fetchModule: any = await import('node-fetch');
        // node-fetch v3 uses default export
        (globalThis as any).fetch = fetchModule.default ?? fetchModule;
      } catch {
        // If import fails, surface a clearer error
        throw new Error('Global fetch is not available and node-fetch could not be loaded. Install node-fetch or use Node 18+.');
      }
    }

    // helper: fetch rest summary for a page title
    async function fetchSummaryFor(titleForFetch: string) {
      const encoded = encodeURIComponent(titleForFetch.trim());
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
      } finally {
        clearTimeout(timeout);
      }
    }

    // If an artist is provided, we'll try to find a page whose Wikidata creator matches that artist.
    // Strategy:
    // 1) Check the exact title page first; if its Wikidata P170 labels include the artist name, accept it.
    // 2) Otherwise perform a search for the title and iterate hits, checking each hit's Wikidata P170 labels for the artist.
    // 3) If nothing matches, fall back to the exact title summary without artist verification.

    // Helper: fetch wikidata entity and return creator labels and instance labels
    async function fetchWikidataLabels(wikidataId: string) {
      const wdUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
      const wdr = await fetch(wdUrl);
      if (!wdr.ok) return null;
      const wdjson = await wdr.json();
      const entity = wdjson?.entities?.[wikidataId];
      const claims = entity?.claims ?? {};
      const creatorIds: string[] = (claims.P170 ?? []).map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);
      const instanceIds: string[] = (claims.P31 ?? []).map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);

      const labels: { creators: string[]; instances: string[] } = { creators: [], instances: [] };

      if (creatorIds.length) {
        const labelsUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${creatorIds.join('|')}&format=json&props=labels&languages=en`;
        const lblRes = await fetch(labelsUrl);
        if (lblRes.ok) {
          const lblJson = await lblRes.json();
          for (const id of creatorIds) {
            const label = lblJson?.entities?.[id]?.labels?.en?.value;
            if (label) labels.creators.push(label);
          }
        }
      }

      if (instanceIds.length) {
        const labelsUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${instanceIds.join('|')}&format=json&props=labels&languages=en`;
        const lblRes = await fetch(labelsUrl);
        if (lblRes.ok) {
          const lblJson = await lblRes.json();
          for (const id of instanceIds) {
            const label = lblJson?.entities?.[id]?.labels?.en?.value;
            if (label) labels.instances.push(label.toLowerCase());
          }
        }
      }

      return labels;
    }

    // Normalize artist string for comparison
    const normalize = (s: string) => s.trim().toLowerCase();
    const targetArtist = artist ? normalize(artist) : null;

    // check exact title first. IMPORTANT: read response body into `primaryJson` once and reuse it
    let primaryRes = await fetchSummaryFor(title);
    let primaryJson: any = null;
    if (primaryRes && primaryRes.ok) {
      try {
        primaryJson = await primaryRes.json();
      } catch {
        primaryJson = null;
      }
      const wikidataId = primaryJson?.wikibase_item;
      if (wikidataId && targetArtist && primaryJson) {
        try {
          const labels = await fetchWikidataLabels(wikidataId);
          if (labels?.creators?.length) {
            const match = labels.creators.some((c) => normalize(c).includes(targetArtist));
            if (match) {
              // exact match on creator — proceed to build result from primaryJson
              const base = primaryJson;
              const result: WikiData = {
                title: base.title ?? title,
                summary: base.extract ?? 'No summary available.',
                thumbnail: base.thumbnail?.source ?? null,
                wikiUrl: base.content_urls?.desktop?.page ?? null,
                artist: labels.creators.join(', '),
                isArtPiece: true,
                wikidataId,
              };
              return result;
            }
          }
        } catch {
          // ignore and continue to search
        }
      }
    }

    // If artist specified but exact title didn't match, search candidates and check creators
    if (targetArtist) {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
        title,
      )}&srlimit=8`;
      const sres = await fetch(searchUrl);
      if (sres.ok) {
        const sjson = await sres.json();
        const hits: { title: string }[] = sjson?.query?.search ?? [];
        for (const h of hits) {
          try {
            const r = await fetchSummaryFor(h.title);
            if (!r || !r.ok) continue;
            const hj = await r.json();
            const wid = hj?.wikibase_item;
            if (!wid) continue;
            const labels = await fetchWikidataLabels(wid);
            if (!labels) continue;
            if (labels.creators.some((c) => normalize(c).includes(targetArtist))) {
              const result: WikiData = {
                title: hj.title ?? h.title,
                summary: hj.extract ?? 'No summary available.',
                thumbnail: hj.thumbnail?.source ?? null,
                wikiUrl: hj.content_urls?.desktop?.page ?? null,
                artist: labels.creators.join(', '),
                isArtPiece: true,
                wikidataId: wid,
              };
              return result;
            }
          } catch {
            // ignore individual candidate failures
          }
        }
      }
    }

    // final fallback: use exact title summary and enrich with wikidata-derived artist/isArtPiece as before
    // Use the primaryJson if we already fetched it; otherwise fetch once and parse
    let json: any = primaryJson;
    if (!json) {
      const r = await fetchSummaryFor(title);
      if (!r || !r.ok) {
        console.warn(`Wikipedia page not found for: ${title} (status ${r?.status})`);
        return null;
      }
      try {
        json = await r.json();
      } catch {
        console.warn(`Failed to parse Wikipedia summary JSON for: ${title}`);
        return null;
      }
    }

    // Prepare base result
    // Try to ensure we have a thumbnail: the REST summary sometimes doesn't include one.
    let thumbnail: string | null = json.thumbnail?.source ?? null;
    if (!thumbnail) {
      try {
        const encodedTitle = encodeURIComponent((json.title ?? title).trim());
        const picUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail|original&pithumbsize=640&titles=${encodedTitle}&origin=*`;
        const picRes = await fetch(picUrl);
        if (picRes.ok) {
          const picJson = await picRes.json();
          const pages = picJson?.query?.pages ?? {};
          const pageKeys = Object.keys(pages);
          if (pageKeys.length) {
            const p = pages[pageKeys[0]];
            thumbnail = p?.thumbnail?.source ?? p?.original?.source ?? thumbnail;
          }
        }
      } catch {
        // ignore image lookup errors
      }
    }

    const result: WikiData = {
      title: json.title ?? title,
      summary: json.extract ?? 'No summary available.',
      thumbnail,
      wikiUrl: json.content_urls?.desktop?.page ?? null,
      artist: null,
      isArtPiece: false,
      wikidataId: json?.wikibase_item ?? null,
    };

    // If the page has an associated Wikidata item, try to fetch creator (P170) and instance (P31)
    const wikidataId: string | undefined = json?.wikibase_item;
    if (wikidataId) {
      try {
        const wdUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
        const wdr = await fetch(wdUrl);
        if (wdr.ok) {
          const wdjson = await wdr.json();
          const entity = wdjson?.entities?.[wikidataId];
          const claims = entity?.claims ?? {};

          // Collect creator IDs (P170) and instance of IDs (P31)
          const creatorIds: string[] = (claims.P170 ?? []).map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);
          const instanceIds: string[] = (claims.P31 ?? []).map((c: any) => c?.mainsnak?.datavalue?.value?.id).filter(Boolean);

          // If we have any creator ids, fetch labels for them
          if (creatorIds.length) {
            const labelsUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${creatorIds.join('|')}&format=json&props=labels&languages=en`;
            const lblRes = await fetch(labelsUrl);
            if (lblRes.ok) {
              const lblJson = await lblRes.json();
              const names: string[] = [];
              for (const id of creatorIds) {
                const label = lblJson?.entities?.[id]?.labels?.en?.value;
                if (label) names.push(label);
              }
              if (names.length) {
                result.artist = names.join(', ');
                result.isArtPiece = true; // presence of creator strongly indicates artwork
              }
            }
          }

          // If not already marked an art piece, inspect instance of (P31) labels for painting/sculpture
          if (!result.isArtPiece && instanceIds.length) {
            const labelsUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${instanceIds.join('|')}&format=json&props=labels&languages=en`;
            const lblRes = await fetch(labelsUrl);
            if (lblRes.ok) {
              const lblJson = await lblRes.json();
              const instLabels: string[] = [];
              for (const id of instanceIds) {
                const label = lblJson?.entities?.[id]?.labels?.en?.value?.toLowerCase();
                if (label) instLabels.push(label);
              }
              // keywords to mark art pieces
              const artKw = ['painting', 'work of art', 'sculpture', 'statue', 'monument', 'portrait', 'landscape'];
              for (const l of instLabels) {
                for (const kw of artKw) {
                  if (l.includes(kw)) {
                    result.isArtPiece = true;
                    break;
                  }
                }
                if (result.isArtPiece) break;
              }
            }
          }
        }
      } catch {
        // ignore wikidata errors and continue returning base summary
      }
    }

    return result;
  } catch (error: any) {
    // Differentiate abort vs other
    if (error?.name === 'AbortError') {
      console.error('Wikipedia fetch aborted (timeout)');
    } else {
      console.error('Wikipedia fetch error:', error?.message ?? error);
    }
    return null;
  }
}

// default export for simpler imports in scripts/tests
export default getWikiData;
