<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role === 'admin') {
            return Message::all();
        }
        return Message::where('sender_id', $request->user()->id)
            ->orWhere('receiver_id', $request->user()->id)
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'body' => 'required|string',
            'receiver_id' => 'nullable|exists:users,id',
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $validated['receiver_id'] ?? null,
            'body' => $validated['body'],
        ]);

        return response()->json($message, 201);
    }

    public function show(Message $message)
    {
        return $message;
    }

    public function update(Request $request, Message $message)
    {
        $message->update($request->only('is_read'));
        return response()->json($message, 200);
    }
}
