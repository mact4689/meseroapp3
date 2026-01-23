
import React from 'react';
import { X, Receipt, Utensils, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from './Button';
import { OrderItem, MenuItem } from '../types';

interface CartItem extends OrderItem { }

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    tableId: string | null;
    orderSent: boolean;
    isSending: boolean;
    cartTotal: number;
    onSendOrder: () => void;
    onRemoveFromCart: (id: string) => void;
    onAddToCart: (item: MenuItem) => void;
    isAdminPreview: boolean;
}

export const CartModal: React.FC<CartModalProps> = ({
    isOpen,
    onClose,
    cart,
    tableId,
    orderSent,
    isSending,
    cartTotal,
    onSendOrder,
    onRemoveFromCart,
    onAddToCart,
    isAdminPreview
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-3xl relative z-10">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-brand-900">Tu Orden</h2>
                        <p className="text-gray-500 text-sm">Mesa {tableId || '1'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {orderSent ? (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-[bounce_1s_infinite]">
                                <Receipt className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-brand-900 mb-2">¡Orden Enviada!</h3>
                            <p className="text-gray-500">La cocina ha recibido tu pedido.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex gap-4 items-start">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Utensils className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-brand-900">{item.name}</h4>
                                        <span className="font-bold text-gray-900">${((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.description}</p>

                                    {/* Display Notes if present */}
                                    {item.notes && (
                                        <div className="mb-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100 flex items-start gap-2">
                                            <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide mt-0.5">Nota:</span>
                                            <p className="text-xs text-yellow-800 italic leading-tight">{item.notes}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                                            <button
                                                onClick={() => onRemoveFromCart(item.id)}
                                                className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:bg-gray-50"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-sm text-brand-900">{item.quantity}</span>
                                            <button
                                                onClick={() => onAddToCart(item)}
                                                className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-brand-900 shadow-sm border border-gray-100 active:bg-gray-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal Footer */}
                {!orderSent && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                        <div className="flex justify-between items-center mb-4 text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-bold text-gray-900">${(cartTotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-xl">
                            <span className="font-serif font-bold text-brand-900">Total</span>
                            <span className="font-serif font-bold text-brand-900">${(cartTotal || 0).toFixed(2)}</span>
                        </div>

                        <Button
                            fullWidth
                            onClick={onSendOrder}
                            disabled={cart.length === 0 || isSending}
                            isLoading={isSending}
                            className="h-14 text-lg"
                            icon={<ShoppingBag className="w-5 h-5" />}
                        >
                            {isAdminPreview ? 'Confirmar Preview' : isSending ? 'Enviando...' : 'Enviar a Cocina'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
