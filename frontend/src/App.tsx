import { useState, useEffect } from 'react';

// 1. Updated TypeScript Interface matching our clean Kaggle dataset
interface Product {
  product_id: string;
  product_name: string;
  brand_name: string;
  price_usd: number;
  ingredients: string;
  score?: number; // Optional vector search similarity score
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Load initial products on app load
  useEffect(() => {
    fetch('http://localhost:8000/api/moisturizers')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch data from the backend');
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // 3. Handle AI Vector Search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:8000/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert("Search failed. Make sure your backend is running.");
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading Sephora skincare data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 font-semibold bg-red-50 p-4 rounded-lg border border-red-200">
          Error: {error}. Is your Python backend running?
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Skincare Dupe Finder</h1>
        <p className="text-gray-600">Search using semantic AI matching to find chemically similar products.</p>
        <div className="mt-4 inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
          Vector Search Active
        </div>
      </header>

      {/* Search Bar Form */}
      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., lightweight soothing squalane cream..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 shadow-sm"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'AI Search'}
          </button>
        </form>
      </div>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => (
            <div key={product.product_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{product.brand_name}</p>
                    <h2 className="text-lg font-bold text-gray-900 leading-tight mt-1">{product.product_name}</h2>
                  </div>
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-1 rounded-lg">
                    ${product.price_usd}
                  </span>
                </div>

                {product.score && (
                  <div className="mb-3">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">
                      Match Score: {(product.score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-500 line-clamp-3 mb-4">
                  <span className="font-semibold text-gray-700">Ingredients:</span> {product.ingredients}
                </p>
              </div>

              <span className="text-xs text-gray-400 font-mono">ID: {product.product_id}</span>
            </div>
          ))}
        </div>

        {products?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No skincare products found matching that description.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;