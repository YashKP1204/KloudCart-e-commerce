import React from 'react';
import { Star, ShoppingCart, Info, Check } from 'lucide-react';
import { Product } from '../types.ts';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  isAdded = false
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
      {/* Product Image */}
      <div 
        className="relative h-48 w-full bg-slate-800 overflow-hidden cursor-pointer"
        onClick={() => onViewDetails(product)}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-xs border border-slate-700/60 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300">
          {product.category}
        </div>
        <div className="absolute top-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs border border-slate-700/60 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400">
          {product.sku}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-1 mb-1.5">
            <div className="flex items-center text-amber-400 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
              <span className="ml-1 font-semibold">{product.rating}</span>
            </div>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-xs text-emerald-400 font-mono">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <h3 
            className="font-semibold text-slate-100 text-base leading-tight mb-2 hover:text-cyan-400 cursor-pointer line-clamp-1"
            onClick={() => onViewDetails(product)}
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer: Price & Actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-mono">USD</span>
            <span className="text-lg font-bold text-white font-mono">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(product)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="View Specifications"
              aria-label="View specifications"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAddToCart(product)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
