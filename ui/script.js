// DOM Elements
const navOptions = document.querySelectorAll('.nav-option');
const tabContents = document.querySelectorAll('.tab-content');
const ingredientsList = document.getElementById('ingredients-list');
const recipesList = document.getElementById('recipes-list');
const showAddFormBtn = document.getElementById('show-add-form');
const addIngredientForm = document.getElementById('add-ingredient-form');
const ingredientForm = document.getElementById('ingredient-form');
const cancelAddBtn = document.getElementById('cancel-add');

// Chat functionality
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendMessageBtn = document.getElementById('send-message');

// State management
let currentIngredients = [];
let currentRecipes = [];

// Generate a unique session ID
const sessionId = Math.random().toString(36).substring(2, 15);

// Add model selector elements
const modelSelect = document.getElementById('model-select');
const modelTooltip = document.querySelector('.model-tooltip');

// Model descriptions
const MODEL_INFO = {
    'gemini-2.5-pro-exp-03-25': {
        name: 'Gemini 2.5 Pro Experimental',
        description: 'Enhanced thinking and reasoning, multimodal understanding, advanced coding capabilities',
        inputs: 'Audio, images, videos, and text',
        output: 'Text'
    },
    'gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        description: 'Next generation features, speed, thinking, realtime streaming, and multimodal generation',
        inputs: 'Audio, images, videos, and text',
        output: 'Text, images (experimental), and audio (coming soon)'
    },
    'gemini-2.0-flash-lite': {
        name: 'Gemini 2.0 Flash-Lite',
        description: 'Cost efficiency and low latency',
        inputs: 'Audio, images, videos, and text',
        output: 'Text'
    },
    'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        description: 'Fast and versatile performance across a diverse variety of tasks',
        inputs: 'Audio, images, videos, and text',
        output: 'Text'
    },
    'gemini-1.5-flash-8b': {
        name: 'Gemini 1.5 Flash-8B',
        description: 'High volume and lower intelligence tasks',
        inputs: 'Audio, images, videos, and text',
        output: 'Text'
    },
    'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        description: 'Complex reasoning tasks requiring more intelligence',
        inputs: 'Audio, images, videos, and text',
        output: 'Text'
    }
};

// Update tooltip content on model selection
modelSelect.addEventListener('change', () => {
    const selectedModel = MODEL_INFO[modelSelect.value];
    modelTooltip.innerHTML = `
        <strong>${selectedModel.name}</strong><br>
        ${selectedModel.description}<br><br>
        <strong>Inputs:</strong> ${selectedModel.inputs}<br>
        <strong>Output:</strong> ${selectedModel.output}
    `;
});

// Set initial tooltip content
modelSelect.dispatchEvent(new Event('change'));

// Update tab switching logic
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.getAttribute('data-tab');
        
        // Update active tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        link.classList.add('active');
    });
});

// Set initial active state
const initialTab = document.querySelector('.nav-link[data-tab="ingredients-tab"]');
if (initialTab) {
    initialTab.classList.add('active');
}

// Show/hide add ingredient form
showAddFormBtn.addEventListener('click', () => {
    addIngredientForm.classList.remove('hidden');
    showAddFormBtn.classList.add('hidden');
});

cancelAddBtn.addEventListener('click', () => {
    addIngredientForm.classList.add('hidden');
    showAddFormBtn.classList.remove('hidden');
    ingredientForm.reset();
});

// Handle ingredient form submission
ingredientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newIngredient = {
        name: document.getElementById('ingredient-name').value,
        category: document.getElementById('ingredient-category').value,
        quantity: parseFloat(document.getElementById('ingredient-quantity').value),
        expiry_date: document.getElementById('ingredient-expiry').value || null,
        brand: document.getElementById('ingredient-brand').value || null
    };
    
    try {
        await addIngredient(newIngredient);
        // Reset form and hide it
        ingredientForm.reset();
        addIngredientForm.classList.add('hidden');
        showAddFormBtn.classList.remove('hidden');
        // Refresh ingredients list
        await fetchIngredients();
    } catch (error) {
        console.error('Error adding ingredient:', error);
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            alert(`${newIngredient.name} is already in your fridge!`);
        } else {
            alert('Failed to add ingredient: ' + error.message);
        }
    }
});

// Function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

// Function to get category class name
function getCategoryClassName(category) {
    const categoryMap = {
        'Fresh Produce': 'fresh-produce',
        'Meat and Seafood': 'meat-and-seafood',
        'Dairy and Eggs': 'dairy-and-eggs',
        'Condiments and Sauces': 'condiments-and-sauces',
        'Beverages': 'beverages',
        'Pre-Packaged Meals and Snacks': 'pre-packaged-meals-and-snacks',
        'Medicinal/Specialty': 'medicinal-specialty',
        'Fermented/Pickled': 'fermented-pickled',
        'Grains/Baked Goods': 'grains-baked-goods'
    };
    
    return categoryMap[category] || 'miscellaneous';
}

// Function to render ingredients
function renderIngredients(ingredients) {
    if (!ingredients || ingredients.length === 0) {
        ingredientsList.innerHTML = '<p class="no-data">No ingredients found</p>';
        return;
    }

    // Add headers first
    const headerHtml = `
        <div class="ingredients-header">
            <div class="header-item">Name</div>
            <div class="header-item">Category</div>
            <div class="header-item">Quantity</div>
            <div class="header-item">Expiry Date</div>
            <div class="header-item">Brand</div>
        </div>
    `;

    const ingredientsHtml = ingredients.map(ingredient => {
        const categoryClass = getCategoryClassName(ingredient.category);
        return `
        <div class="ingredient-card" data-id="${ingredient.id}">
            <div class="ingredient-content">
                <div class="ingredient-field">
                    <span class="field-label">Name</span>
                    <span class="field-value">${ingredient.name}</span>
                </div>
                <div class="ingredient-field">
                    <span class="field-label">Category</span>
                    <span class="field-value category-text category-${categoryClass}">${ingredient.category || 'N/A'}</span>
                </div>
                <div class="ingredient-field">
                    <span class="field-label">Quantity</span>
                    <span class="field-value">
                        <div class="quantity-controls">
                            <button class="quantity-btn decrease-qty" data-id="${ingredient.id}">-</button>
                            <span>${ingredient.quantity}</span>
                            <button class="quantity-btn increase-qty" data-id="${ingredient.id}">+</button>
                        </div>
                    </span>
                </div>
                <div class="ingredient-field">
                    <span class="field-label">Expiry Date</span>
                    <span class="field-value">${formatDate(ingredient.expiry_date)}</span>
                </div>
                <div class="ingredient-field">
                    <span class="field-label">Brand</span>
                    <span class="field-value">${ingredient.brand || 'N/A'}</span>
                </div>
                <div class="ingredient-actions">
                    <button class="delete-button" data-id="${ingredient.id}" onclick="handleDelete(${ingredient.id}, '${ingredient.name}')">
                        <span class="material-icons">delete</span>Remove
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    ingredientsList.innerHTML = headerHtml + ingredientsHtml;
    
    // Add event listeners for the quantity buttons
    attachIngredientEventListeners();
}

// Function to attach event listeners to ingredient cards
function attachIngredientEventListeners() {
    // Increase quantity buttons
    document.querySelectorAll('.increase-qty').forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.getAttribute('data-id');
            const ingredient = currentIngredients.find(ing => ing.id === parseInt(id));
            if (ingredient) {
                const newQuantity = parseFloat(ingredient.quantity) + 1;
                try {
                    await updateIngredient(id, { quantity: newQuantity });
                    await fetchIngredients();
                } catch (error) {
                    console.error('Error updating quantity:', error);
                    alert('Failed to update quantity: ' + error.message);
                }
            }
        });
    });
    
    // Decrease quantity buttons
    document.querySelectorAll('.decrease-qty').forEach(button => {
        button.addEventListener('click', async () => {
            const id = button.getAttribute('data-id');
            const ingredient = currentIngredients.find(ing => ing.id === parseInt(id));
            
            if (ingredient) {
                const currentQty = parseFloat(ingredient.quantity);
                
                if (currentQty > 1) {
                    const newQuantity = currentQty - 1;
                    try {
                        await updateIngredient(id, { quantity: newQuantity });
                        await fetchIngredients();
                    } catch (error) {
                        console.error('Error updating quantity:', error);
                        alert('Failed to update quantity: ' + error.message);
                    }
                } else if (currentQty === 1) {
                    if (confirm(`The quantity is 1. Do you want to remove this ingredient completely?`)) {
                        try {
                            await deleteIngredient(id);
                            await fetchIngredients();
                        } catch (error) {
                            console.error('Error deleting ingredient:', error);
                            alert('Failed to delete ingredient: ' + error.message);
                        }
                    }
                }
            }
        });
    });
}

// Function to render recipes
function renderRecipes(recipes) {
    if (!recipes || recipes.length === 0) {
        recipesList.innerHTML = '<p class="no-data">No recipes available yet</p>';
        return;
    }

    recipesList.innerHTML = recipes.map(recipe => `
        <div class="recipe-card">
            <h3>${recipe.name}</h3>
            <p>${recipe.description}</p>
            <div class="recipe-ingredients">
                <strong>Required Ingredients:</strong>
                <ul>
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}

// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Function to fetch ingredients from backend
async function fetchIngredients() {
    ingredientsList.innerHTML = '<div class="loading"></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/ingredients`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched ingredients:', data);
        currentIngredients = data;
        renderIngredients(currentIngredients);
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        ingredientsList.innerHTML = '<p class="error">Failed to load ingredients: ' + error.message + '</p>';
    }
}

// Function to add a new ingredient
async function addIngredient(ingredient) {
    try {
        const response = await fetch(`${API_BASE_URL}/ingredients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ingredient)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding ingredient:', error);
        throw error;
    }
}

// Function to update an ingredient
async function updateIngredient(id, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating ingredient:', error);
        throw error;
    }
}

// Function to delete an ingredient
async function deleteIngredient(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/ingredients/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        throw error;
    }
}

// Function to fetch recipe recommendations
async function fetchRecipes() {
    recipesList.innerHTML = '<div class="loading"></div>';
    setTimeout(() => {
        recipesList.innerHTML = '<p class="info">Recipe functionality will be available soon!</p>';
    }, 500);
}

// Chat functionality
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    // If it's a user message, just use text, otherwise parse markdown
    if (isUser) {
        messageDiv.textContent = message;
    } else {
        // Parse markdown and set as HTML
        messageDiv.innerHTML = marked.parse(message);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, true);
    chatInput.value = '';

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message,
                sessionId,
                model: modelSelect.value // Add selected model to the request
            }),
        });

        const data = await response.json();
        
        if (data.success) {
            addMessage(data.response);
        } else {
            addMessage('Sorry, I encountered an error. Please try again.');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Sorry, I encountered an error. Please try again.');
    }
}

// Event listeners for chat
sendMessageBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Add initial bot message
addMessage(`## 👨‍🍳 Welcome to Your Personal Sous-Chef! 🥗

    Hello! I'm your culinary assistant, ready to help you create delicious meals. 🍽️
    
    I can assist you with:
    - Finding recipes based on your available ingredients 🧺
    - Accommodating dietary preferences and restrictions:
      - 🥕 Vegetarian
      - 🌱 Vegan
      - 💪 Protein-rich
      - 🌾 Gluten-free
    - Exploring healthier cooking options 🥦
    
    Let's get cooking! 🔪
    
    How may I help you today?`);
    
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    fetchIngredients();
    fetchRecipes();
});

// Add this new function for handling delete
async function handleDelete(id, name) {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
        try {
            await deleteIngredient(id);
            await fetchIngredients();
        } catch (error) {
            console.error('Error deleting ingredient:', error);
            alert('Failed to delete ingredient: ' + error.message);
        }
    }
}