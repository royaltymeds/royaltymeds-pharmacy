'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { OTCDrug } from '@/lib/types/inventory';
import { DEFAULT_INVENTORY_IMAGE } from '@/lib/constants/inventory';
import { ShoppingCart, Search, Loader, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [slideShowIndex, setSlideShowIndex] = useState(0);
  const [showSaleModal, setShowSaleModal] = useState(false);
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

  // Get items on sale for slideshow
  const saleItems = useMemo(
    () => activeDrugs.filter((drug) => drug.is_on_sale === true),
    [activeDrugs]
  );

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    if (saleItems.length === 0) return;
    const interval = setInterval(() => {
      setSlideShowIndex((prev) => (prev + 1) % saleItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [saleItems.length]);

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
        matchesSale = drug.is_on_sale === true;
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
        {/* Sale Items Slideshow */}
        {saleItems.length > 0 && (
          <button
            onClick={() => setShowSaleModal(true)}
            className="relative w-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="relative w-full h-64 md:h-96 bg-gray-900 flex items-center justify-center">
              <Image
                src={saleItems[slideShowIndex].file_url || DEFAULT_INVENTORY_IMAGE}
                alt={saleItems[slideShowIndex].name}
                fill
                className="object-contain p-8"
              />
              
              {/* Sale Badge */}
              <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                SALE
              </div>
              
              {/* Product Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 text-white">
                <h2 className="text-2xl md:text-3xl font-bold">{saleItems[slideShowIndex].name}</h2>
                <p className="text-sm mt-2 opacity-90">{saleItems[slideShowIndex].active_ingredient}</p>
                <div className="flex items-center gap-3 mt-3">
                  {(() => {
                    let displayPrice = saleItems[slideShowIndex].unit_price;
                    let discountPercent = 0;
                    if (saleItems[slideShowIndex].sale_price && saleItems[slideShowIndex].sale_price > 0) {
                      displayPrice = saleItems[slideShowIndex].sale_price;
                      discountPercent = Math.round(((saleItems[slideShowIndex].unit_price - displayPrice) / saleItems[slideShowIndex].unit_price) * 100);
                    } else if (saleItems[slideShowIndex].sale_discount_percent && saleItems[slideShowIndex].sale_discount_percent > 0) {
                      displayPrice = saleItems[slideShowIndex].unit_price * (1 - saleItems[slideShowIndex].sale_discount_percent / 100);
                      discountPercent = saleItems[slideShowIndex].sale_discount_percent;
                    }
                    return (
                      <>
                        <span className="text-3xl font-bold">
                          {formatCurrency(displayPrice)}
                        </span>
                        {displayPrice < saleItems[slideShowIndex].unit_price && (
                          <>
                            <span className="text-lg line-through opacity-75">
                              {formatCurrency(saleItems[slideShowIndex].unit_price)}
                            </span>
                            {discountPercent > 0 && (
                              <span className="text-xl font-bold text-green-400 ml-2">
                                -{discountPercent}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            {saleItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideShowIndex((prev) => (prev - 1 + saleItems.length) % saleItems.length);
                  }}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 transition-all z-10 sm:p-3"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideShowIndex((prev) => (prev + 1) % saleItems.length);
                  }}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 transition-all z-10 sm:p-3"
                  aria-label="Next slide"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {saleItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlideShowIndex(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === slideShowIndex ? 'bg-white w-8' : 'bg-white bg-opacity-50'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </button>
        )}
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
            On Sale & Clearance
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
              On Sale / Clearance
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
                
                {/* Sale Banner */}
                {drug.is_on_sale && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                    ON SALE
                  </div>
                )}
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
                    <p className="text-xs text-gray-500 font-medium">Price</p>
                    <div className="flex items-baseline gap-2">
                      {(() => {
                        // Calculate the display price based on sale_price or sale_discount_percent
                        let displayPrice = drug.unit_price;
                        let discountPercent = 0;
                        if (drug.is_on_sale) {
                          if (drug.sale_price && drug.sale_price > 0) {
                            displayPrice = drug.sale_price;
                            discountPercent = Math.round(((drug.unit_price - displayPrice) / drug.unit_price) * 100);
                          } else if (drug.sale_discount_percent && drug.sale_discount_percent > 0) {
                            displayPrice = drug.unit_price * (1 - drug.sale_discount_percent / 100);
                            discountPercent = drug.sale_discount_percent;
                          }
                        }
                        return (
                          <>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(displayPrice)}</p>
                            {drug.is_on_sale && displayPrice < drug.unit_price && (
                              <>
                                <span className="text-sm line-through text-gray-500">
                                  {formatCurrency(drug.unit_price)}
                                </span>
                                {discountPercent > 0 && (
                                  <span className="text-sm font-bold text-green-600">
                                    -{discountPercent}%
                                  </span>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
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

      {/* Sale Items Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-2xl font-bold text-white">On Sale & Clearance Items</h2>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {saleItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {saleItems.map((drug) => (
                    <div
                      key={drug.id}
                      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                    >
                      {/* Image Section */}
                      <div className="relative w-full h-48 sm:h-56 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                        <Image
                          src={drug.file_url || DEFAULT_INVENTORY_IMAGE}
                          alt={drug.name}
                          fill
                          className="object-contain p-4"
                        />
                        
                        {/* Sale Banner */}
                        {drug.is_on_sale && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                            ON SALE
                          </div>
                        )}
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
                            <p className="text-xs text-gray-500 font-medium">Price</p>
                            <div className="flex items-baseline gap-2">
                              {(() => {
                                // Calculate the display price based on sale_price or sale_discount_percent
                                let displayPrice = drug.unit_price;
                                let discountPercent = 0;
                                if (drug.is_on_sale) {
                                  if (drug.sale_price && drug.sale_price > 0) {
                                    displayPrice = drug.sale_price;
                                    discountPercent = Math.round(((drug.unit_price - displayPrice) / drug.unit_price) * 100);
                                  } else if (drug.sale_discount_percent && drug.sale_discount_percent > 0) {
                                    displayPrice = drug.unit_price * (1 - drug.sale_discount_percent / 100);
                                    discountPercent = drug.sale_discount_percent;
                                  }
                                }
                                return (
                                  <>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(displayPrice)}</p>
                                    {drug.is_on_sale && displayPrice < drug.unit_price && (
                                      <>
                                        <span className="text-sm line-through text-gray-500">
                                          {formatCurrency(drug.unit_price)}
                                        </span>
                                        {discountPercent > 0 && (
                                          <span className="text-sm font-bold text-green-600">
                                            -{discountPercent}%
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

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
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg">No items currently on sale.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
