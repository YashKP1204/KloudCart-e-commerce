import React, { useState } from 'react';
import { X, Star, ShoppingCart, Check, ShieldCheck, Cpu } from 'lucide-react';
import { Product } from '../types.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-850 px-2 py-0.5 rounded">
              {product.category}
            </span>
            <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image */}
            <div className="h-60 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/90 text-xs px-2 py-1 rounded font-mono text-emerald-400">
                {product.stock} units in inventory
              </div>
            </div>

            {/* Main Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-amber-400 text-sm">
                  <Star className="w-4 h-4 fill-amber-400 stroke-none" />
                  <span className="ml-1 font-bold">{product.rating}</span>
                </div>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-400">Verified Workload Hardware</span>
              </div>

              <h2 className="text-xl font-bold text-white leading-tight">
                {product.name}
              </h2>

              <div className="text-2xl font-bold text-cyan-400 font-mono">
                ${product.price.toFixed(2)}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          {/* Technical Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Technical Specifications</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-slate-700/40">
                    <span className="text-slate-400 font-mono">{key}:</span>
                    <span className="text-slate-200 font-medium font-mono text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Qty:</span>
            <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-mono"
              >
                -
              </button>
              <span className="px-3 py-1 text-xs font-mono text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-2.5 py-1 text-slate-300 hover:bg-slate-800 font-mono"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add {quantity} to Cart • ${(product.price * quantity).toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
