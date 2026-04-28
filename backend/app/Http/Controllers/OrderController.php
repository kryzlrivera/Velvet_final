<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role === 'admin') {
            return Order::with(['items', 'rider'])->get();
        }
        if ($request->user()->role === 'rider') {
            return Order::where('rider_id', $request->user()->id)->with(['items', 'rider'])->get();
        }
        return Order::where('user_id', $request->user()->id)->with(['items', 'rider'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'total_amount' => 'required|numeric',
            'notes' => 'nullable|string',
            'wrap_style' => 'nullable|string',
            'shipping_address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.custom_details' => 'nullable|array',
        ]);

        $order = Order::create([
            'user_id' => $request->user()->id,
            'total_amount' => $validated['total_amount'],
            'notes' => $validated['notes'] ?? null,
            'wrap_style' => $validated['wrap_style'] ?? null,
            'shipping_address' => $validated['shipping_address'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'status' => 'Pending',
        ]);

        foreach ($validated['items'] as $item) {
            $order->items()->create($item);
            $product = \App\Models\Product::find($item['product_id']);
            if ($product) {
                $product->decrement('stock_quantity', $item['quantity']);
            }
        }

        return response()->json($order->load('items'), 201);
    }

    public function guestCheckout(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'total_amount' => 'required|numeric',
            'notes' => 'nullable|string',
            'wrap_style' => 'nullable|string',
            'shipping_address' => 'required|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.custom_details' => 'nullable|array',
        ]);

        $user = User::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'password' => Hash::make(Str::random(16)),
                'role' => 'customer',
            ]
        );

        $order = Order::create([
            'user_id' => $user->id,
            'total_amount' => $validated['total_amount'],
            'notes' => $validated['notes'] ?? null,
            'wrap_style' => $validated['wrap_style'] ?? null,
            'shipping_address' => $validated['shipping_address'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'status' => 'Pending',
        ]);

        foreach ($validated['items'] as $item) {
            $order->items()->create($item);
            $product = \App\Models\Product::find($item['product_id']);
            if ($product) {
                $product->decrement('stock_quantity', $item['quantity']);
            }
        }

        return response()->json([
            'order' => $order->load('items'),
            'user' => $user,
            'access_token' => $user->createToken('auth_token')->plainTextToken,
            'message' => 'Guest order created. A temporary account has been created with your email.'
        ], 201);
    }

    public function show(Order $order, Request $request)
    {
        if ($request->user()->role !== 'admin' && $order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return $order->load('items');
    }

    public function update(Request $request, Order $order)
    {
        if ($request->user()->role === 'admin') {
            $order->update($request->only(['status', 'rider_id']));
        } else if ($request->user()->role === 'rider') {
            // Rider can only update status
            $order->update($request->only(['status']));
        }
        return response()->json($order, 200);
    }
}
