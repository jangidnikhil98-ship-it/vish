"use client";

import Link from "next/link";
import { formatINR, useCart } from "@/app/components/CartProvider";
import { useState } from "react";

export default function CartClient() {
  const { items, count, total, removeItem, updateQuantity, giftNote, setGiftNote } = useCart();
  const [showGiftNote, setShowGiftNote] = useState(Boolean(giftNote));

  const subtotal = total;
  // Free shipping over 2000, else 99 logic is implemented here for now.
  const shipping = subtotal > 2000 ? 0 : (subtotal > 0 ? 99 : 0);
  const finalTotal = subtotal + shipping;

  if (count === 0) {
    return (
      <section className="cart-empty text-center py-20 px-4 min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-[#fdf7ef] flex items-center justify-center text-[#613a18]">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-[#613a18] mb-4 tracking-tight">Your cart is empty</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg font-light">Looks like you haven&apos;t added any beautiful gifts to your cart yet.</p>
        <Link href="/products" className="bg-[#613a18] text-white px-8 py-3 rounded-md hover:bg-[#4b2d12] transition-colors font-medium">
          Start Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="cart-container container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-semibold text-[#613a18] mb-10 tracking-tight">Your Cart</h1>
      
      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => (
            <article key={item.id} className="cart-item bg-white p-5 rounded-xl border border-[#e9d8c6] shadow-sm flex flex-col sm:flex-row gap-6 transition-all hover:shadow-md">
              
              <div className="cart-item-image shrink-0 mx-auto sm:mx-0 w-28 h-28 bg-[#faf7f4] rounded-lg overflow-hidden border border-[#f4eadb]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || "/img/no-image.png"} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="cart-item-details flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{item.name}</h2>
                    {item.size && <p className="text-sm text-gray-500 mb-1">Size: {item.size}</p>}
                    
                    {/* Add more personalization details here if needed */}
                    {(item.frontMessage || item.backMessage || item.giftWrapping === "yes") && (
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {item.frontMessage && <p><span className="font-medium text-gray-600">Front:</span> {item.frontMessage}</p>}
                        {item.backMessage && <p><span className="font-medium text-gray-600">Back:</span> {item.backMessage}</p>}
                        {item.giftWrapping === "yes" && <p className="text-[#613a18]">✓ Gift Wrapped</p>}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)} 
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex justify-between items-end mt-4">
                  <div className="quantity-selector flex items-center bg-[#faf7f4] border border-[#e9d8c6] rounded-md">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-[#f4eadb] transition-colors rounded-l-md font-medium"
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="px-4 py-1 text-gray-800 font-medium text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-[#f4eadb] transition-colors rounded-r-md font-medium"
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                  <div className="font-semibold text-lg text-[#613a18]">
                    ₹{formatINR(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {/* Gift Note Section */}
          <div className="gift-note-section bg-[#fcf9f5] p-5 rounded-xl border border-[#e9d8c6]">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowGiftNote(!showGiftNote)}>
              <div className="flex items-center gap-2 text-[#613a18] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add a gift message (Optional)
              </div>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${showGiftNote ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {showGiftNote && (
              <div className="mt-4">
                <textarea 
                  className="w-full p-3 border border-[#e9d8c6] rounded-lg focus:ring-1 focus:ring-[#613a18] focus:border-[#613a18] outline-none text-sm resize-none"
                  rows={3}
                  placeholder="Type your gift message here..."
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2 font-light">This message will be included in the package. Max 150 characters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="order-summary sticky top-28 bg-[#faf7f4] border border-[#d8c4b2] p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-[#613a18] mb-6 tracking-tight">Order Summary</h2>
            
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                <span className="font-medium">₹{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Estimated Shipping</span>
                <span className="font-medium">{shipping === 0 ? "Free" : `₹${shipping}`}</span>
              </div>
              {shipping > 0 && (
                <div className="text-xs text-[#2c8b3d]">
                  Free shipping on orders above ₹2000
                </div>
              )}
            </div>
            
            <div className="border-t border-[#e9d8c6] pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{formatINR(finalTotal)}</span>
              </div>
              <p className="text-xs text-gray-500 font-light mt-1 text-right">Tax included</p>
            </div>
            
            <Link 
              href="/checkout" 
              className="w-full block text-center bg-[#613a18] text-white py-3.5 rounded-lg hover:bg-[#4b2d12] transition-colors font-medium shadow-sm text-lg"
            >
              Checkout securely
            </Link>
            
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex justify-center gap-4 opacity-70">
                 {/* Trust Badges placeholder */}
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <p className="text-xs text-gray-500 font-light">100% Secure & Encrypted Checkout</p>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
