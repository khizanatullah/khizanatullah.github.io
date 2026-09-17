const google = require('googlethis');

async function search(query) {
  try {
    const options = {
      page: 0, 
      safe: false, 
      parse_ads: false,
      additional_params: {
        hl: 'id'
      }
    };
    
    const response = await google.search(query, options);
    const results = response.results.slice(0, 5);
    
    if (results.length === 0) {
      // Fallback to python wikipedia search
      const { execSync } = require('child_process');
      try {
        const output = execSync(`python3 search-ddg.py "${query}"`).toString();
        console.log(output);
      } catch(e) {
        console.log("Tidak ada hasil pencarian.");
      }
      return;
    }
    
    results.forEach((res, index) => {
      console.log(`[${index + 1}] ${res.title}`);
      console.log(`Link: ${res.url}`);
      console.log(`Ringkasan: ${res.description}\n`);
    });
  } catch (error) {
    // Fallback to python wikipedia search
    const { execSync } = require('child_process');
    try {
      const output = execSync(`python3 search-ddg.py "${query}"`).toString();
      console.log(output);
    } catch(e) {
      console.error(`Error fetching search results: ${error.message}`);
    }
  }
}

const query = process.argv.slice(2).join(' ');
if (query) {
  search(query);
} else {
  console.log("Masukkan kata kunci pencarian.");
}
