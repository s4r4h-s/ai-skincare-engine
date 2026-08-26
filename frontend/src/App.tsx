import { useState, useEffect } from 'react';

interface Product {
  product_id: string;
  product_name: string;
  brand_name: string;
  price_usd: number;
  ingredients: string;
}

interface Conflict {
  type: string;
  severity: string;
  message: string;
}

interface EvaluationResult {
  evaluated_products: string[];
  conflicts: Conflict[];
  warnings: string[];
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [routine, setRoutine] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial products
  useEffect(() => {
    fetch('http://localhost:8000/api/moisturizers')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch data from backend');
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

  const addToRoutine = (product: Product) => {
    if (!routine.find(p => p.product_id === product.product_id)) {
      setRoutine([...routine, product]);
      setEvaluation(null); // Clear previous results
    }
  };

  const removeFromRoutine = (productId: string) => {
    setRoutine(routine.filter(p => p.product_id !== productId));
    setEvaluation(null);
  };

  const handleAnalyze = async () => {
    if (routine.length === 0) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/evaluate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: routine.map(p => p.product_id) })
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Make sure your Python backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-slate-600 animate-pulse">Loading Skincare Database...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-12 font-sans text-slate-800">
      
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-4">
          Routine Compatibility Engine
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Build your skincare routine and use our AI engine to check for chemical conflicts, barrier warnings, and ingredient interactions.
        </p>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mb-8 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Product Library */}
        <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-2xl flex flex-col h-[700px]">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{products.length}</span>
            Product Library
          </h2>
          
          <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
            {products.map(product => (
              <div key={product.product_id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{product.brand_name}</p>
                    <h3 className="text-base font-semibold text-slate-900 leading-tight mb-2">{product.product_name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2"><span className="font-medium text-slate-700">Ingredients:</span> {product.ingredients}</p>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">${product.price_usd}</span>
                    <button 
                      onClick={() => addToRoutine(product)}
                      disabled={routine.some(p => p.product_id === product.product_id)}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      {routine.some(p => p.product_id === product.product_id) ? 'Added ✓' : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Routine & Analysis */}
        <section className="flex flex-col gap-8 h-[700px]">
          
          {/* Routine Builder */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-2xl flex-shrink-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Your Routine</h2>
              {routine.length > 0 && (
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <span className="animate-pulse">Analyzing...</span>
                  ) : (
                    <>✨ Analyze Routine</>
                  )}
                </button>
              )}
            </div>

            {routine.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 font-medium">
                Add products from the library to build your routine.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {routine.map(product => (
                  <div key={product.product_id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">{product.brand_name}</p>
                      <p className="text-sm font-bold text-slate-800">{product.product_name}</p>
                    </div>
                    <button 
                      onClick={() => removeFromRoutine(product.product_id)}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-2xl flex-1 overflow-y-auto custom-scrollbar relative">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Analysis Results</h2>
            
            {!evaluation ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center h-full pt-16">
                <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p>Click "Analyze Routine" to see how your products interact.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                
                {/* Status Summary */}
                {evaluation.conflicts.length === 0 && evaluation.warnings.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 p-5 rounded-2xl flex gap-4 items-start shadow-sm">
                    <div className="bg-green-100 p-2 rounded-full text-green-600 mt-1">✓</div>
                    <div>
                      <h4 className="font-bold text-green-800 text-lg">Routine looks great!</h4>
                      <p className="text-green-700 text-sm mt-1">No chemical conflicts or barrier warnings detected.</p>
                    </div>
                  </div>
                ) : null}

                {/* Conflicts */}
                {evaluation.conflicts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Critical Conflicts ({evaluation.conflicts.length})
                    </h3>
                    {evaluation.conflicts.map((conflict, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border shadow-sm ${conflict.severity === 'High' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold ${conflict.severity === 'High' ? 'text-red-800' : 'text-orange-800'}`}>
                            {conflict.type}
                          </h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${conflict.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {conflict.severity} Risk
                          </span>
                        </div>
                        <p className={`text-sm ${conflict.severity === 'High' ? 'text-red-700' : 'text-orange-700'}`}>
                          {conflict.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {evaluation.warnings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      Barrier Warnings ({evaluation.warnings.length})
                    </h3>
                    {evaluation.warnings.map((warning, idx) => (
                      <div key={idx} className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl shadow-sm">
                        <p className="text-sm text-yellow-800">{warning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;