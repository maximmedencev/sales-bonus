/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
       // purchase — это одна из записей в поле items из чека в data.purchase_records
   // _product — это продукт из коллекции data.products
      const { discount, sale_price, quantity } = purchase;
      return (sale_price * quantity) * (1 - (discount / 100));
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
          
    let bonusPercent;
    
    if (index === 0) {
        bonusPercent = 0.15;
    } else if (index === 1 || index === 2) {
        bonusPercent = 0.10; 
    } else if (index === total - 1) {
        bonusPercent = 0; 
    } else {
        bonusPercent = 0.05; 
    }

    return seller.profit * bonusPercent;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    if (typeof options != "object") {
        throw new Error(`Отсутствуют опции`);
    }

    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue) {
        throw new Error(`calculateRevenue отсутвует в опциях`);
    }

    if (!calculateBonus) {
        throw new Error(`calculateBonus отсутвует в опциях`);
    }

    if(typeof calculateRevenue != "function") {
        throw new Error(`calculateRevenue не функция`);
    }

    if(typeof calculateBonus != "function") {
        throw new Error(`calculateBonus не функция`);
    }
 
    const requiredCollections = ['customers', 'products', 'sellers', 'purchase_records'];
    for (const collection of requiredCollections) {
        console.log(data[collection].length);
        if (!Array.isArray(data[collection])) {
            throw new Error(`Отсутсвует ${collection}`);
        }
        if (data[collection].length === 0) {
            throw new Error(`Массив ${collection} не должен быть пустым`);
        }
        
    }

    let sellerIndex = Object.fromEntries(data.sellers.map(seller => [seller.id, {id: seller.id, name: `${seller.first_name} ${seller.last_name}`, revenue: 0, profit: 0, sales_count: 0, products_sold:[]}]));
    let productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));
    
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = +calculateRevenue(item);
            const profit = revenue - cost;
            seller.profit += profit;
      
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });


        seller.sales_count++;
        seller.revenue += record.total_amount;
    });
    let sellerStats = Object.values(sellerIndex).sort((a, b) => b.profit - a.profit);
   
    sellerStats.forEach((seller, index) => {
        seller.bonus = +calculateBonus(index, sellerStats.length, seller).toFixed(2);
        
        seller.profit = +seller.profit.toFixed(2);
        seller.revenue = +seller.revenue.toFixed(2); 
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku,
                quantity
        }))
        .sort((a,b) => b.quantity - a.quantity)
        .slice(0, 10);

        delete seller.products_sold;

    });

    return sellerStats;
}