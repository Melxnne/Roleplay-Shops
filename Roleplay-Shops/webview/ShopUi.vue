<template>
    <div class="shop-container">
      <!-- Header with Title and Filter -->
      <div class="shop-header">
  <!-- Logo and Shop Title Container -->
  <div class="shop-title-container">
    <img src="/images/logo.png" alt="Shop Logo" class="shop-logo" />
    <h1 class="shop-title">{{ currentShop }} Shop</h1>
  </div>

  <div class="filter-container">
    <!-- Search Box with Icon -->
    <div class="search-container">
      <i class="fas fa-search search-icon"></i>
      <input
        type="text"
        class="search-box"
        v-model="searchQuery"
        @input="filterItems"
        placeholder="Search..."
      />
    </div>

    <!-- Filter Dropdown -->
    <select class="filter-dropdown" v-model="selectedFilter" @change="filterItems">
      <option value="All">All</option>
      <option value="Food">Food</option>
      <option value="Drinks">Drinks</option>
      <option value="Other">Other</option>
    </select>

    <button @click="closeShop()" class="close-shopui" aria-label="Close ShopUI">X</button>
  </div>
</div>
  
      <!-- Shop Items and Cart Section -->
      <div class="shop-main">
        <div class="shop-items">
          <div class="items-grid">
            <div class="shop-item-card" v-for="item in filteredItems" :key="item.id">
              <div class="shop-item">
                <div class="shop-item-image-container">
                  <img :src="`/images/${item.itemname}.png`" alt="Item image" class="item-image" />
                </div>
                <div class="item-info">
                  <span class="item-name">{{ item.displayname }}</span>
                  <span class="item-price">${{ item.price }}</span>
                </div>
                <button class="add-button" @click="addToCart(item)">
                  <i class="fas fa-shopping-cart"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Cart Sidebar -->
        <div class="cart">
          <h3 class="cart-title">Your Cart</h3>
          <div class="cart-items">
            <ul>
                <li v-for="item in cart" :key="item.id" class="cart-item">
  <img :src="`/images/${item.itemname}.png`" alt="Item image" class="cart-item-image" />
  <div class="cart-item-details">
    <span class="cart-item-name">{{ item.displayname }}</span>
    <div class="cart-item-quantity">
      <button class="quantity-button minus" @click="removeFromCart(item)">-</button>
      {{ item.quantity }}
      <button class="quantity-button plus" @click="addToCart(item)">+</button>
    </div>
    <span class="cart-item-price">${{ item.price * item.quantity }}</span>
  </div>
</li>
            </ul>
          </div>
  
          <!-- Cart Footer with Total and Payment Buttons -->
          <div class="cart-footer">
            <span class="cart-total">Total: ${{ totalPrice }}</span>
            <div class="payment-buttons">
              <button class="payment-button card" @click="purchaseItems('bank')">
                <i class="fas fa-credit-card"></i> Pay with Card
              </button>
              <button class="payment-button cash" @click="purchaseItems('cash')">
                <i class="fas fa-cash-register"></i> Pay with Cash
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  
  
  
  <script lang="ts" setup>
import { computed } from 'vue';
import { useEvents } from '../../../../webview/composables/useEvents';
import { ref, watch } from 'vue';
import { Shops } from '@Plugins/Roleplay-Shops/shared/config.js';
import { getItemById } from '@Plugins/Roleplay-Core/server/apis/InventoryApi';



const Events = useEvents();

const shops = ref(Shops);

console.log('Shops:', shops.value);


shops.value.forEach(shop => {
    console.log(`Shop Name: ${shop.name}`);
    console.log('Items:', shop.items);
});

const currentShop = ref('Strawberry');
const selectedFilter = ref('All');
const cart = ref([]);
const searchQuery = ref('');


const shopItems = ref([]);




Events.on('openshop', async (data) => {
    currentShop.value = data.shopname || 'Strawberry';

    // Items für den aktuellen Shop abrufen
    const shop = shops.value.find((shop) => shop.name === currentShop.value);
    if (shop) {
        const itemsWithImages = await Promise.all(
            shop.items.map(async (item) => {
               
                return {
                    ...item,
                    
                };
            })
        );

        shopItems.value = itemsWithImages;
        console.log('Shop items updated:', shopItems.value);
    }
});



const filteredItems = computed(() => {
    let items = shopItems.value;


    if (selectedFilter.value !== 'All') {
        items = items.filter((item) => item.category === selectedFilter.value);
    }

    // Filter nach Suchbegriff
    if (searchQuery.value) {
        items = items.filter((item) =>
            item.displayname.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
    }

    return items;
});




  



const totalPrice = computed(() =>
  cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
);

function addToCart(item) {
  const cartItem = cart.value.find((cartItem) => cartItem.id === item.id);
  if (cartItem) {
    cartItem.quantity++;
  } else {
    cart.value.push({ ...item, quantity: 1 });
  }
}

function removeFromCart(item) {
  const cartItem = cart.value.find((cartItem) => cartItem.id === item.id);
  if (cartItem.quantity > 1) {
    cartItem.quantity--;
  } else {
    cart.value = cart.value.filter((cartItem) => cartItem.id !== item.id);
  }
}

function purchaseItems(paymentMethod) {
  const purchaseData = {
    items: cart.value.map((item) => ({
      id: item.id,
      name: item.itemname,
      price: item.price,
      quantity: item.quantity,
    })),
    totalPrice: totalPrice.value,
    purchaseMethod: paymentMethod,
  };

  
  Events.emitServer('purchaseItems', purchaseData.items, purchaseData.totalPrice, purchaseData.purchaseMethod);

  console.log('Daten an den Server gesendet:', purchaseData.items, purchaseData.totalPrice, purchaseData.purchaseMethod);

  
  cart.value = [];
}

function closeShop() {
  Events.emitServer('closeshop');
  console.log("Closed the Shop")
}

function filterItems() {
  console.log(`Filter applied: ${selectedFilter.value}`);
}






</script>
  
  <style scoped>
/* Shop Container */
.shop-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(145deg, #2e2e2e, #1c1c1c);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.3); /* Subtle border for clean look */
  width: 80%;
  height: 80%;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: transparent, transparent;
  
}



/* Header Container */
.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Distribute space evenly */
  padding: 12px 20px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3); /* Subtle border for clean look */
  border-radius: 8px;
  width: 100%;
  margin-bottom: 20px;
}

/* Logo and Shop Title Container */
.shop-title-container {
  display: flex;
  align-items: center;
}

/* Logo Styling */
.shop-logo {
  height: 40px; /* Adjust the size as needed */
  margin-right: 10px; /* Reduced space between logo and title */
  object-fit: contain; /* Ensures the image doesn't stretch */
}

/* Shop Title Styling */
.shop-title {
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

/* Filter Container */
.filter-container {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Align the filter elements to the right */
  gap: 10px; /* Space between filter elements */
}

/* Search Box Styling */
.search-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #444, #333);
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  height: 40px;
  margin-right: 10px;
  width: 200px;
}

.search-box {
  background: transparent;
  color: white;
  border: none;
  width: 100%;
  padding-left: 10px;
  font-size: 16px;
}

.search-icon {
  color: white;
  margin-right: 8px;
}

/* Filter Dropdown Styling */
.filter-dropdown {
  background: linear-gradient(135deg, #444, #333);
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  height: 40px;
  margin-right: 10px;
  font-size: 18px;
  text-align: center; /* Center text in the dropdown */
}

/* Close Button Styling */
.close-shopui {
  background: linear-gradient(135deg, #444, #333);
  color: white;
  font-size: 18px;
  padding: 10px 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.3s ease;
}

/* Hover effect for Close Button */
.close-shopui:hover {
  background: linear-gradient(135deg, #555, #444);
}

.close-shopui:focus {
  outline: none;
}



/* Shop Main Section */
.shop-main {
  display: flex;
  width: 100%;
  justify-content: space-between;
  flex-grow: 1;
  max-height: calc(100% - 100px);
  overflow: hidden;
}

.shop-items {
  flex: 3;
  overflow-y: auto;
  margin-right: 20px;
  background: linear-gradient(145deg, #2a2a2a, #333);
  border-radius: 10px;
  padding: 20px 40px; /* Adjust padding to ensure equal space from left and right */
  max-height: 100%;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.shop-items::-webkit-scrollbar {
  width: 8px;
}

.shop-items::-webkit-scrollbar-thumb {
  background-color: #333;
  border-radius: 10px;
}

.shop-items::-webkit-scrollbar-thumb:hover {
  background-color: #45a049;
}

.shop-items::-webkit-scrollbar-track {
  background: #333;
  border-radius: 10px;
}

/* Adjust grid spacing for items */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px; /* Increased gap for more space between items */
  margin-top: 20px;
}

/* Shop Item Card */
.shop-item-card {
  background: linear-gradient(145deg, #333, #444);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 250px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Item Information Section */
.shop-item {
  background: #44444400;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  transition: transform 0.3s ease-in-out;
  width: 100%;
  height: 100%;
}

/* Shop Item Image Styling */
.shop-item-image-container {
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  margin-top: 25px; /* Move image a bit lower to center it more */
}

.item-image {
  width: 70%;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
}

/* Item Name and Price Styling */
.item-info {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  margin-bottom: auto; /* Push the name and price to the top */
}

/* Item Name Styling */
.item-name {
  font-size: 18px; /* Increased size */
  font-weight: bold;
  color: white;
  margin: 0;
  padding-right: 10px;
  position: absolute;
  top: 10px; /* Position the item name at the top-left */
  left: 15px;
}

/* Price Tag Styling */
.item-price {
  font-size: 18px; /* Thicker font size */
  font-weight: bold;
  color: #23be98; /* No background color */
  background: none; /* Gradient applied as text color */
  padding: 0;
  text-align: center;
  position: absolute;
  top: 10px;
  right: 15px;
}

/* Add Button Styling (Buy Button) */
.add-button {
  background: transparent;
  color: white;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  cursor: pointer;
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 50px; /* Set width and height to make it square */
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-button:hover {
  background: linear-gradient(145deg, #4CAF50, #23be98);
}

.add-button i {
  margin-right: 0; /* Remove margin from icon inside the square button */
}

/* Shop Item Card Hover Effect */
.shop-item-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Cart Section */
.cart {
  flex: 2;
  background: linear-gradient(145deg, #333, #444);
  border-radius: 10px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  scrollbar-width: thin;
  scrollbar-color: #44444400 #33333300;
  border: 1px solid rgba(255, 255, 255, 0.3); /* Subtle border for clean look */
  box-sizing: border-box;
}

.cart-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.cart-items {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

/* Cart item styling */
.cart-item {
  display: flex; /* Flex layout */
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* Border between items */
  gap: 20px; /* Space between image and details */
  position: relative; /* Positioning context for absolute items */
  box-sizing: border-box;
}

.cart-item-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: contain;
}

.cart-item-details {
  display: flex;
  flex-direction: row; /* Items in a row */
  justify-content: flex-start; /* Align the items to the left */
  gap: 10px; /* Space between name and price */
  flex-grow: 1; /* Allow details to take remaining space */
  align-items: center; /* Center vertically */
  box-sizing: border-box;
}

/* Fixed position for item name and price */
.cart-item-name {
  font-size: 16px;
  font-weight: bold;
  color: white;
}

.cart-item-price {
  font-size: 16px;
  color: white;
  position: absolute; /* Fix position */
  left: 50%; /* Center it horizontally */
  transform: translateX(-50%); /* Ensure true centering */
  text-align: center; /* Center the text horizontally */
  display: flex;
  justify-content: center; /* Center price text horizontally */
  align-items: center; /* Center vertically */
  background: linear-gradient(145deg, #4CAF50, #23be98); /* Gradient similar to quantity buttons */
  padding: 5px 15px; /* Extra padding for consistency */
  border-radius: 5px; /* Rounded corners */
  box-sizing: border-box;
  z-index: 1; /* Ensure the price stays above other items */
  width: auto;
  min-width: 80px; /* Minimum width for the price box */
  max-width: 120px; /* Maximum width to avoid stretching too much */
}

/* Adjusting quantity selector */
.cart-item-quantity {
  display: flex;
  justify-content: space-between; /* Keep buttons in a row */
  align-items: center;
  gap: 10px; /* Space between quantity buttons */
  width: 120px; /* Fixed width for the quantity selector container */
  position: absolute;
  right: 20px; /* Positioning quantity selector on the right */
}

.quantity-button {
  background: linear-gradient(145deg, #4CAF50, #23be98);
  color: white;
  border: none;
  padding: 5px;
  border-radius: 5px;
  cursor: pointer;
  width: 30px; /* Fixed width for the button */
  font-size: 18px;
  font-weight: bold;
}

.quantity-button:hover {
  background: #45a049;
}

.quantity-button:focus {
  outline: none;
}

/* Cart Footer with Total and Payment Buttons */
.cart-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  box-sizing: border-box;
}

.cart-total {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.payment-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
  box-sizing: border-box;
  padding-left: 20px; /* Added padding for consistent spacing */
  padding-right: 20px; /* Added padding for consistent spacing */
}

.payment-button {
  background: linear-gradient(145deg, #4CAF50, #23be98);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
}

.payment-button:hover {
  background: #45a049;
}

.payment-button i {
  margin-right: 5px;
}






  </style>
  