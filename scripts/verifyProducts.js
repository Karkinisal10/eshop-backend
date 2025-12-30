const mongoose = require('mongoose')
const productModel = require('../models/productModel')

mongoose.connect('mongodb://127.0.0.1:27017/ec')

setTimeout(async () => {
  try {
    const products = await productModel.find({}, 'name category brand')
    console.log('✓ Total products in database:', products.length)
    
    const uniqueNames = new Set(products.map(p => p.name))
    console.log('✓ Unique product names:', uniqueNames.size)
    
    if (products.length === uniqueNames.size) {
      console.log('\n✓✓✓ SUCCESS: NO DUPLICATES! Each product is completely unique.\n')
    } else {
      console.log('\n❌ WARNING: Some products are duplicated!\n')
    }
    
    console.log('First 10 products:')
    products.slice(0,10).forEach((p,i) => console.log(`  ${i+1}. [${p.category}] ${p.brand} - ${p.name}`))
    
    console.log('\nLast 10 products:')
    products.slice(-10).forEach((p,i) => console.log(`  ${products.length-9+i}. [${p.category}] ${p.brand} - ${p.name}`))
    
    // Show category breakdown
    const categoryCount = {}
    products.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
    })
    
    console.log('\nProducts by category:')
    Object.entries(categoryCount).forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count} products`)
    })
    
    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}, 1000)
