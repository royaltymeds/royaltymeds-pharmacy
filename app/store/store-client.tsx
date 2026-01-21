'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { OTCDrug } from '@/lib/types/inventory';
import { DEFAULT_INVENTORY_IMAGE } from '@/lib/constants/inventory';
import { ShoppingCart, Search, AlertCircle } from 'lucide-react';
import { addToCart } from '@/app/actions/orders';
import { toast } from 'sonner';
import { useCart } from '@/lib/context/CartContext';

interface Props {
  drugs: OTCDrug[];
}

export default function StoreClientComponent({ drugs }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { addItem } = useCart();

  // Filter drugs by status (only active)
  const activeDrugs = useMemo(
    () => drugs.filter((drug) => drug.status === 'active'),
    [drugs]
  );

  // Get unique categories
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

      return matchesSearch && matchesCategory;
    });
  }, [activeDrugs, searchTerm, selectedCategory]);

  const handleAddToCart = async (drug: OTCDrug) => {
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

        {/* Results count */}
        <p className="text-sm text-gray-600">
          Found {filteredDrugs.length} product{filteredDrugs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Products Grid */}
      {filteredDrugs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrugs.map((drug) => (
            <div
              key={drug.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-72"
            >
              {/* Main Content Area */}
              <div className="flex flex-1">
                {/* Product Info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{drug.name}</h3>
                    {drug.active_ingredient && (
                      <p className="text-sm text-gray-600">{drug.active_ingredient}</p>
                    )}
                  </div>

                  {/* Category and Manufacturer */}
                  <div className="text-sm text-gray-600">
                    <p>{drug.category}</p>
                    {drug.manufacturer && <p className="text-xs">{drug.manufacturer}</p>}
                  </div>

                  {/* Description */}
                  {drug.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">{drug.description}</p>
                  )}
                </div>

                {/* Product Image */}
                <div className="relative w-32 h-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Image
                    src={drug.file_url || DEFAULT_INVENTORY_IMAGE}
                    alt={drug.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              </div>

              {/* Footer - Price and Button */}
              <div className="p-4 space-y-2 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">${drug.unit_price.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{drug.pack_size || 'Standard'}</p>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(drug)}
                    disabled={addingToCart === drug.id || drug.quantity_on_hand === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <ShoppingCart size={18} />
                    {addingToCart === drug.id ? 'Adding...' : 'Add'}
                  </button>
                </div>

                {/* Stock Status */}
                {drug.quantity_on_hand === 0 && (
                  <p className="text-red-600 text-sm font-medium">Out of Stock</p>
                )}
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
  );
}
