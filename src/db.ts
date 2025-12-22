import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
}

export interface User {
    id: string;
    username: string;
    passwordHash: string;
}

export let products: Product[] = [
    { id: '1', name: 'Premium Coffee', price: 4.50, stock: 50, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop' },
    { id: '2', name: 'Avocado Toast', price: 12.00, stock: 20, image: 'https://www.allrecipes.com/thmb/8NccFzsaq0_OZPDKmf7Yee-aG78=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/AvocadoToastwithEggFranceC4x3-bb87e3bbf1944657b7db35f1383fabdb.jpg' },
    { id: '3', name: 'Green Smoothie', price: 7.50, stock: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHqWWge9x5HL-88Ax3mJ1IhgN3meBvNIOh4Q&s' },
    { id: '4', name: 'Blueberry Muffin', price: 3.75, stock: 15, image: 'https://static01.nyt.com/images/2023/04/27/dining/03COOKING-JORDANMARSHMUFFIN2/03COOKING-JORDANMARSHMUFFIN2-threeByTwoMediumAt2X-v2.jpg' },
    { id: '5', name: 'Croissant', price: 3.25, stock: 25, image: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Croissant-Petr_Kratochvil.jpg' },
    { id: '6', name: 'Artisan Sourdough', price: 8.00, stock: 10, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE9r-lTbqJKsW1nwiQTdVftDfHtIbyqbzyPQ&s' },
];

export let users: User[] = [
    {
        id: uuidv4(),
        username: 'admin',
        // Hash for password 'admin'
        passwordHash: bcrypt.hashSync('admin', 10)
    }
];

export const updateProducts = (newProducts: Product[]) => {
    products = newProducts;
};

export const updateUsers = (newUsers: User[]) => {
    users = newUsers;
};
