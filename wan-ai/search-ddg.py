import urllib.request
import urllib.parse
import re
import sys
import html
import json

def search(query):
    # Cross-origin Wikipedia API for reliable general knowledge search
    # or rely on duckduckgo HTML scraping as fallback
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&utf8=&format=json"
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'VioletAI/1.0 (https://violetai.app)'
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            results = []
            
            for i, item in enumerate(data.get('query', {}).get('search', [])[:5]):
                clean_snippet = re.sub(r'<[^>]+>', '', item.get('snippet', ''))
                title = item.get('title', '')
                link_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title)}"
                results.append(f"[{i+1}] {title}\nLink: {link_url}\nRingkasan: {html.unescape(clean_snippet)}\n")
                
            if not results:
                print("Tidak ada hasil pencarian di Wikipedia.")
            else:
                print("\n".join(results))
    except Exception as e:
        print(f"Error fetching search results: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        search(" ".join(sys.argv[1:]))
    else:
        print("Masukkan kata kunci pencarian.")
