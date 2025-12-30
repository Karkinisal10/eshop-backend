const natural = require('natural');
const TfIdf = natural.TfIdf;

class RecommendationEngine {
    
    // Calculate cosine similarity between two vectors
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
        
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }

    // Prepare product text for vectorization
    prepareProductText(product) {
        const features = [
            product.name || '',
            product.category || '',
            product.description || '',
            product.brand || '',
            product.shopName || ''
        ];
        return features.join(' ').toLowerCase();
    }

    // Build TF-IDF matrix for all products
    buildTfIdfMatrix(products) {
        const tfidf = new TfIdf();
        
        // Add documents to TF-IDF
        products.forEach(product => {
            const text = this.prepareProductText(product);
            tfidf.addDocument(text);
        });

        return tfidf;
    }

    // Get TF-IDF vector for a document
    getTfIdfVector(tfidf, docIndex, vocabulary) {
        const vector = new Array(vocabulary.length).fill(0);
        
        tfidf.listTerms(docIndex).forEach(item => {
            const termIndex = vocabulary.indexOf(item.term);
            if (termIndex !== -1) {
                vector[termIndex] = item.tfidf;
            }
        });

        return vector;
    }

    // Build vocabulary from TF-IDF
    buildVocabulary(tfidf, productCount) {
        const vocabularySet = new Set();
        
        for (let i = 0; i < productCount; i++) {
            tfidf.listTerms(i).forEach(item => {
                vocabularySet.add(item.term);
            });
        }

        return Array.from(vocabularySet);
    }

    // Get similar products based on content-based filtering
    getSimilarProducts(targetProduct, allProducts, limit = 10) {
        if (!allProducts || allProducts.length === 0) {
            return [];
        }

        // Build TF-IDF matrix
        const tfidf = this.buildTfIdfMatrix(allProducts);
        const vocabulary = this.buildVocabulary(tfidf, allProducts.length);

        // Find target product index
        const targetIndex = allProducts.findIndex(
            p => p._id.toString() === targetProduct._id.toString()
        );

        if (targetIndex === -1) {
            return [];
        }

        // Get TF-IDF vector for target product
        const targetVector = this.getTfIdfVector(tfidf, targetIndex, vocabulary);

        // Calculate similarity scores for all products
        const similarities = allProducts.map((product, index) => {
            if (index === targetIndex) {
                return { product, similarity: 0 }; // Exclude the product itself
            }

            const productVector = this.getTfIdfVector(tfidf, index, vocabulary);
            const similarity = this.cosineSimilarity(targetVector, productVector);

            return { product, similarity };
        });

        // Sort by similarity (highest first) and return top N
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => item.product);
    }

    // Get recommended products for homepage (featured, trending, etc.)
    getRecommendedProducts(allProducts, type = 'featured', limit = 12) {
        if (!allProducts || allProducts.length === 0) {
            return [];
        }

        let scoredProducts = [];

        switch (type) {
            case 'featured':
                // Featured: Balanced score of rating, discount, and recency
                scoredProducts = allProducts.map(product => {
                    const recencyScore = this.calculateRecencyScore(product.createdAt);
                    const ratingScore = (product.rating || 0) / 5; // Normalize to 0-1
                    const discountScore = (product.discount || 0) / 100; // Normalize to 0-1
                    const stockScore = product.stock > 0 ? 1 : 0;

                    // Weighted scoring: 30% recency, 40% rating, 20% discount, 10% stock
                    const totalScore = (
                        recencyScore * 0.3 +
                        ratingScore * 0.4 +
                        discountScore * 0.2 +
                        stockScore * 0.1
                    );

                    return { product, score: totalScore };
                });
                break;

            case 'trending':
                // Trending: Based on recent popularity (views, rating, recency)
                scoredProducts = allProducts.map(product => {
                    const recencyScore = this.calculateRecencyScore(product.createdAt);
                    const ratingScore = (product.rating || 0) / 5;
                    const viewScore = Math.min((product.views || 0) / 100, 1); // Normalize

                    const totalScore = (
                        recencyScore * 0.4 +
                        ratingScore * 0.3 +
                        viewScore * 0.3
                    );

                    return { product, score: totalScore };
                });
                break;

            case 'best_deals':
                // Best Deals: High discount with good rating
                scoredProducts = allProducts.map(product => {
                    const discountScore = (product.discount || 0) / 100;
                    const ratingScore = (product.rating || 0) / 5;
                    const stockScore = product.stock > 0 ? 1 : 0;

                    const totalScore = (
                        discountScore * 0.6 +
                        ratingScore * 0.3 +
                        stockScore * 0.1
                    );

                    return { product, score: totalScore };
                });
                break;

            default:
                // Default: by rating
                scoredProducts = allProducts.map(product => ({
                    product,
                    score: product.rating || 0
                }));
        }

        return scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.product);
    }

    // Calculate recency score (newer products get higher scores)
    calculateRecencyScore(createdAt) {
        const now = new Date();
        const productDate = new Date(createdAt);
        const daysDiff = (now - productDate) / (1000 * 60 * 60 * 24);
        
        // Products less than 7 days old get score 1
        // Score decreases exponentially over 90 days
        if (daysDiff < 7) return 1;
        if (daysDiff > 90) return 0.1;
        
        return Math.max(0.1, 1 - (daysDiff / 90) * 0.9);
    }

    // Get personalized recommendations based on user's browsing history
    getPersonalizedRecommendations(userHistory, allProducts, limit = 10) {
        if (!userHistory || userHistory.length === 0) {
            // If no history, return featured products
            return this.getRecommendedProducts(allProducts, 'featured', limit);
        }

        // Build user profile from browsing history
        const tfidf = this.buildTfIdfMatrix(allProducts);
        const vocabulary = this.buildVocabulary(tfidf, allProducts.length);

        // Create user profile vector (average of viewed products)
        const userVector = new Array(vocabulary.length).fill(0);
        let viewedCount = 0;

        userHistory.forEach(historyItem => {
            const productIndex = allProducts.findIndex(
                p => p._id.toString() === historyItem.productId.toString()
            );

            if (productIndex !== -1) {
                const productVector = this.getTfIdfVector(tfidf, productIndex, vocabulary);
                productVector.forEach((val, idx) => {
                    userVector[idx] += val;
                });
                viewedCount++;
            }
        });

        // Average the vectors
        if (viewedCount > 0) {
            userVector.forEach((val, idx) => {
                userVector[idx] = val / viewedCount;
            });
        }

        // Calculate similarity with all products
        const recommendations = allProducts.map((product, index) => {
            // Exclude products already in history
            const inHistory = userHistory.some(
                h => h.productId.toString() === product._id.toString()
            );

            if (inHistory) {
                return { product, similarity: -1 };
            }

            const productVector = this.getTfIdfVector(tfidf, index, vocabulary);
            const similarity = this.cosineSimilarity(userVector, productVector);

            return { product, similarity };
        });

        // Primary: only positives
        const positive = recommendations
            .filter(item => item.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity);

        if (positive.length >= limit) {
            return positive.slice(0, limit).map(item => item.product);
        }

        // Fallback: include zero-similarity items (excluding history) to avoid empty results on small catalogs
        const nonHistory = recommendations
            .filter(item => item.similarity >= 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        return nonHistory.map(item => item.product);
    }
}

module.exports = new RecommendationEngine();
