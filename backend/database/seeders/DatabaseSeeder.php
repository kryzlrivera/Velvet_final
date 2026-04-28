<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        \App\Models\User::create([
            'name' => 'Admin User',
            'email' => 'admin@velvetvine.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        \App\Models\User::create([
            'name' => 'Delivery Rider',
            'email' => 'rider@velvetvine.test',
            'password' => bcrypt('password'),
            'role' => 'rider',
        ]);

        \App\Models\Product::create([
            'name' => 'Classic Red Roses',
            'description' => 'A beautiful bouquet of 12 classic red roses.',
            'price' => 49.99,
            'stock_quantity' => 50,
            'category' => 'Occasions',
            'image_url' => '/images/red-roses.jpg',
            'is_active' => true,
        ]);

        \App\Models\Product::create([
            'name' => 'White Lilies & Pink Carnations',
            'description' => 'Elegant white lilies mixed with sweet pink carnations.',
            'price' => 39.99,
            'stock_quantity' => 30,
            'category' => 'Flower Type',
            'image_url' => '/images/lilies-carnations.jpg',
            'is_active' => true,
        ]);
    }
}
