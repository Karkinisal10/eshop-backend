const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ec', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const categorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    image: String
}, { timestamps: true });

const Category = mongoose.model('categorys', categorySchema);

async function addDefaultCategories() {
    try {
        const existingCategories = await Category.find({});
        console.log(`Found ${existingCategories.length} existing categories`);
        
        if (existingCategories.length > 0) {
            console.log('\n=== Existing Categories ===');
            existingCategories.forEach(cat => {
                console.log(`- ${cat.name} (${cat.slug})`);
            });
            console.log('\nCategories already exist. No action needed.');
            process.exit(0);
        }

        // Add default categories
        const defaultCategories = [
            { name: 'Electronics', slug: 'electronics', image: 'https://via.placeholder.com/150?text=Electronics' },
            { name: 'Clothing', slug: 'clothing', image: 'https://via.placeholder.com/150?text=Clothing' },
            { name: 'Books', slug: 'books', image: 'https://via.placeholder.com/150?text=Books' },
            { name: 'Home & Garden', slug: 'home-garden', image: 'https://via.placeholder.com/150?text=Home' },
            { name: 'Sports', slug: 'sports', image: 'https://via.placeholder.com/150?text=Sports' },
            { name: 'Toys', slug: 'toys', image: 'https://via.placeholder.com/150?text=Toys' },
            { name: 'Beauty', slug: 'beauty', image: 'https://via.placeholder.com/150?text=Beauty' },
            { name: 'Food', slug: 'food', image: 'https://via.placeholder.com/150?text=Food' }
        ];

        await Category.insertMany(defaultCategories);
        
        console.log('✅ Default categories added successfully!');
        console.log('\n=== Added Categories ===');
        defaultCategories.forEach(cat => {
            console.log(`- ${cat.name}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addDefaultCategories();
