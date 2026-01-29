'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { OTCDrug } from '@/lib/types/inventory';
import { DEFAULT_INVENTORY_IMAGE } from '@/lib/constants/inventory';
import { ShoppingCart, Search, Loader } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { addToCart } from '@/app/actions/orders';
import { toast } from 'sonner';
import { useCart } from '@/lib/context/CartContext';
import { AuthRequiredModal } from './AuthRequiredModal';
import { createClient } from '@/lib/supabase-browser';

interface Props {
  drugs: OTCDrug[];
}

export default function StoreClientComponent({ drugs }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [saleFilter, setSaleFilter] = useState<'all' | 'sale' | 'clearance'>('all');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { addItem } = useCart();

  // Filter to only active drugs for store display
  const activeDrugs = useMemo(
    () => drugs.filter((drug) => drug.status === 'active'),
    [drugs]
  );

  // Get unique categories from active drugs
  const categories = useMemo(
    () => [...new Set(activeDrugs.map((drug) => drug.category))],
    [activeDrugs]
  );

  // Filter by search and category
  const filteredDrugs = useMemo(() => {
    return activeDrugs.filter((drug) => {
      const matchesSearch =
        drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.active_ingredient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory ? drug.category === selectedCategory : true;

      // Filter by sale status
      let matchesSale = true;
      if (saleFilter === 'sale') {
        matchesSale = drug.is_on_sale === true && drug.category_type === 'sale';
      } else if (saleFilter === 'clearance') {
        matchesSale = drug.category_type === 'clearance';
      }

      return matchesSearch && matchesCategory && matchesSale;
    });
  }, [activeDrugs, searchTerm, selectedCategory, saleFilter]);

  const handleAddToCart = async (drug: OTCDrug) => {
    // Check authentication
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setAddingToCart(drug.id);

    try {
      await addToCart(drug.id, 1);
      addItem(drug.id, drug.name, 1);
      toast.success(`${drug.name} added to cart!`, {
        duration: 3000,
        position: 'top-right',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
      toast.error(errorMessage, {
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <div className="space-y-8">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, ingredient, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Sale Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deals & Clearance
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSaleFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                saleFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => setSaleFilter('sale')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                saleFilter === 'sale'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              On Sale
            </button>
            <button
              onClick={() => setSaleFilter('clearance')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                saleFilter === 'clearance'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Clearance
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600">
          Found {filteredDrugs.length} product{filteredDrugs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Products Grid */}
      {filteredDrugs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredDrugs.map((drug) => (
            <div
              key={drug.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Image Section - Centered and Prominent */}
              <div className="relative w-full h-48 sm:h-56 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                <Image
                  src={drug.file_url || DEFAULT_INVENTORY_IMAGE}
                  alt={drug.name}
                  fill
                  className="object-contain p-4"
                />
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-4 flex-1 flex flex-col">
                {/* Title and Ingredient */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{drug.name}</h3>
                  {drug.active_ingredient && (
                    <p className="text-sm text-gray-600 mt-1">{drug.active_ingredient}</p>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">Category</p>
                    <p className="font-medium text-gray-900 mt-1">{drug.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">Pack Size</p>
                    <p className="font-medium text-gray-900 mt-1">{drug.pack_size || 'Standard'}</p>
                  </div>
                  {drug.manufacturer && (
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs font-medium">Manufacturer</p>
                      <p className="font-medium text-gray-900 mt-1">{drug.manufacturer}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {drug.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{drug.description}</p>
                )}

                {/* Price and Stock Section */}
                <div className="space-y-3 border-t border-gray-100 pt-3 mt-auto">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Unit Price</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(drug.unit_price)}</p>
                      {drug.sale_price && drug.sale_price < drug.unit_price && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm line-through text-gray-500">
                            {formatCurrency(drug.unit_price)}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(drug.sale_price)}
                          </span>
                        </div>
                      )}
                    </div>
                    {drug.sale_discount_percent && drug.sale_discount_percent > 0 && (
                      <div className="mt-1 inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                        -{drug.sale_discount_percent}% OFF
                      </div>
                    )}
                  </div>

                  {/* Sale/Clearance Badge */}
                  {drug.category_type && drug.category_type !== 'regular' && (
                    <div className={`text-xs font-bold text-center py-1 rounded ${
                      drug.category_type === 'clearance'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {drug.category_type === 'clearance' ? '🔥 CLEARANCE' : '✨ ON SALE'}
                    </div>
                  )}

                  {/* Stock Status */}
                  {drug.quantity_on_hand === 0 ? (
                    <div className="w-full py-2 text-center bg-red-50 text-red-600 text-sm font-medium rounded-lg">
                      Out of Stock
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(drug)}
                      disabled={addingToCart === drug.id}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-auto"
                    >
                      {addingToCart === drug.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
        </div>
      )}
      </div>
    </>
  );
}
